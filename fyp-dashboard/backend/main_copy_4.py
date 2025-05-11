from fastapi import FastAPI
from kubernetes import client, config
import pandas as pd
import numpy as np
import joblib
import tensorflow as tf
import requests
import datetime
import os

from prometheus_fastapi_instrumentator import Instrumentator

from fastapi.middleware.cors import CORSMiddleware

from autoscaler import router as autoscaler_router
from autoscaler_metrics import router as autoscaler_metrics_router

app = FastAPI()

# CORS (Allow React frontend to access the API)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(autoscaler_router)
app.include_router(autoscaler_metrics_router)

# Enable metrics on /metrics endpoint
Instrumentator().instrument(app).expose(app)

# Constants
PROMETHEUS_URL = "http://localhost:9090"  # Adjust if running Prometheus elsewhere
QUERY = 'sum(rate(http_requests_total[1m])) by (pod)'
DEPLOYMENT_NAME = "auth-service"
NAMESPACE = "default"
WINDOW_SIZE = 60
VOLATILITY_WINDOW = 15
SCALE_UP_THRESHOLD = 1.2  # 20% increase
SCALE_DOWN_THRESHOLD = 0.8  # 20% decrease

# Load model and scaler
model = tf.keras.models.load_model("autoscaler_model.keras", custom_objects={
    'PositionalEncoding': __import__('inference').PositionalEncoding
})
scaler = joblib.load("scaler.save")

# Configure Kubernetes client
config.load_kube_config()
k8s_apps_v1 = client.AppsV1Api()

@app.get("/pods")
def get_pods():
    v1 = client.CoreV1Api()
    pods = v1.list_pod_for_all_namespaces(watch=False)
    return {
        "pods": [
            {
                "name": pod.metadata.name,
                "namespace": pod.metadata.namespace,
                "status": pod.status.phase,
                "ip": pod.status.pod_ip,
            }
            for pod in pods.items
        ]
    }

@app.get("/replicas")
def get_replicas():
    apps_v1 = client.AppsV1Api()
    deployments = apps_v1.list_deployment_for_all_namespaces(watch=False)
    return {
        "replicas": [
            {
                "name": dep.metadata.name,
                "namespace": dep.metadata.namespace,
                "desired": dep.spec.replicas,
                "current": dep.status.ready_replicas or 0,
            }
            for dep in deployments.items
        ]
    }

# Step 1: Get data from Prometheus
def fetch_recent_http_metrics():
    end = int(datetime.datetime.now().timestamp())
    start = end - 60 * 60  # Last 60 minutes
    step = 60

    response = requests.get(f"{PROMETHEUS_URL}/api/v1/query_range", params={
        "query": "sum(rate(http_requests_total[1m]))",
        "start": start,
        "end": end,
        "step": step
    })

    results = response.json()["data"]["result"]
    if not results:
        raise Exception("No data found from Prometheus")

    values = results[0]["values"]  # [ [timestamp, value], ... ]
    df = pd.DataFrame(values, columns=["timestamp", "http_requests"])
    df["timestamp"] = pd.to_datetime(df["timestamp"], unit="s")
    df.set_index("timestamp", inplace=True)
    df["http_requests"] = df["http_requests"].astype(float)
    return df


# Step 2: Preprocess

def preprocess(df):
    df["volatility"] = df["http_requests"].rolling(VOLATILITY_WINDOW).std().fillna(0)
    df["hour"] = df.index.hour / 23.0
    df["minute"] = df.index.minute / 59.0
    df["day_of_week"] = df.index.dayofweek / 6.0
    df["is_weekend"] = df.index.dayofweek.isin([5, 6]).astype(float)

    df[["http_requests", "volatility"]] = scaler.transform(df[["http_requests", "volatility"]])

    if len(df) < WINDOW_SIZE:
        raise ValueError("Not enough data to predict")

    return df.drop(columns=["http_requests"]).iloc[-WINDOW_SIZE:].values, df


# Step 3: Predict future workload

def forecast(model_input):
    preds = []
    window = model_input.copy()
    last_ts = pd.Timestamp.now()

    for _ in range(60):
        pred = model.predict(window[np.newaxis, ...], verbose=0)[0][0]
        preds.append(pred)

        new_time = last_ts + pd.Timedelta(minutes=1)
        new_feats = np.array([
            0.0,  # dummy volatility
            new_time.hour / 23.0,
            new_time.minute / 59.0,
            new_time.dayofweek / 6.0,
            float(new_time.dayofweek in [5, 6])
        ])
        window = np.vstack([window[1:], new_feats])
        last_ts = new_time

    inverse = scaler.inverse_transform(np.hstack([np.array(preds).reshape(-1, 1), np.zeros((60, 1))]))
    return inverse[:, 0]


# Step 4: Scaling logic

def apply_scaling_logic(current_load, forecasted):
    avg_pred = np.mean(forecasted[-5:])  # last 5 mins of forecast
    print(f"Current Load: {current_load:.2f}, Forecasted Avg: {avg_pred:.2f}")

    if avg_pred > current_load * SCALE_UP_THRESHOLD:
        return "scale_up"
    elif avg_pred < current_load * SCALE_DOWN_THRESHOLD:
        return "scale_down"
    else:
        return "no_action"


# Step 5: Trigger Kubernetes Scaling

def scale_deployment(action):
    deploy = k8s_apps_v1.read_namespaced_deployment(DEPLOYMENT_NAME, NAMESPACE)
    current_replicas = deploy.spec.replicas
    new_replicas = current_replicas

    if action == "scale_up":
        new_replicas = current_replicas + 1
    elif action == "scale_down" and current_replicas > 1:
        new_replicas = current_replicas - 1

    if new_replicas != current_replicas:
        deploy.spec.replicas = new_replicas
        k8s_apps_v1.patch_namespaced_deployment(name=DEPLOYMENT_NAME, namespace=NAMESPACE, body=deploy)

    return {
        "previous": current_replicas,
        "new": new_replicas
    }


# FastAPI Endpoint
@app.post("/run-autoscaler")
def run_autoscaler():
    try:
        df = fetch_recent_http_metrics()
        current_load = df["http_requests"].values[-1]
        input_window, _ = preprocess(df)
        forecasted = forecast(input_window)
        decision = apply_scaling_logic(current_load, forecasted)
        scaling_result = scale_deployment(decision)

        return {
            "status": "success",
            "current_load": round(current_load, 2),
            "forecasted_avg": round(np.mean(forecasted[-5:]), 2),
            "scaling_decision": decision,
            "replicas": scaling_result
        }

    except Exception as e:
        return {"status": "error", "message": str(e)}
