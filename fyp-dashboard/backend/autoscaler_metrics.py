# autoscaler_metrics.py
import os
import logging
from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import pandas as pd
from datetime import datetime, timedelta
import json

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create API router
router = APIRouter(
    prefix="/autoscaler/metrics",
    tags=["autoscaler_metrics"],
    responses={404: {"description": "Not found"}},
)

# Models for responses
class ScalingMetrics(BaseModel):
    timestamp: str
    deployment: str
    replicas: int

class TrafficDataPoint(BaseModel):
    timestamp: str
    http_requests: int

class PredictionDataPoint(BaseModel):
    timestamp: str
    predicted_requests: float

class ConfigurationItem(BaseModel):
    key: str
    value: Any
    description: str

class Configuration(BaseModel):
    items: List[ConfigurationItem]

class ConfigUpdate(BaseModel):
    key: str
    value: Any

# Default configuration
default_config = {
    "MODEL_PATH": {"value": "tcn_forecaster.keras", "description": "Path to the trained model file"},
    "SCALER_PATH": {"value": "scaler.save", "description": "Path to the scaler model"},
    "DATA_FILE": {"value": "7_days_data.csv", "description": "Path to the traffic data file"},
    "THRESHOLD": {"value": 310, "description": "Request threshold for scaling up"},
    "WINDOW_SIZE": {"value": 30, "description": "Window size for model input"},
    "FORECAST_MINUTES": {"value": 20, "description": "Forecast window in minutes"},
    "SCALE_UP_REPLICAS": {"value": 3, "description": "Number of replicas when scaling up"},
    "DEFAULT_REPLICAS": {"value": 1, "description": "Default number of replicas"}
}

# Try to load configuration if it exists
CONFIG_FILE = "autoscaler_config.json"
config = {}

try:
    if os.path.exists(CONFIG_FILE):
        with open(CONFIG_FILE, 'r') as f:
            config = json.load(f)
    else:
        config = default_config
        with open(CONFIG_FILE, 'w') as f:
            json.dump(config, f)
except Exception as e:
    logger.error(f"Error loading configuration: {str(e)}")
    config = default_config

def save_config():
    """Save the current configuration to file"""
    try:
        with open(CONFIG_FILE, 'w') as f:
            json.dump(config, f)
        return True
    except Exception as e:
        logger.error(f"Error saving configuration: {str(e)}")
        return False

@router.get("/scaling-history", response_model=List[ScalingMetrics])
async def get_scaling_history(limit: int = 50):
    """Get the scaling action history"""
    try:
        if os.path.exists("scaling_metrics.csv"):
            df = pd.read_csv("scaling_metrics.csv", names=["timestamp", "deployment", "replicas"])
            df = df.tail(limit)
            
            result = []
            for _, row in df.iterrows():
                result.append({
                    "timestamp": row["timestamp"],
                    "deployment": row["deployment"],
                    "replicas": int(row["replicas"])
                })
            return result
        else:
            return []
    except Exception as e:
        logger.error(f"Error fetching scaling history: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch scaling history: {str(e)}")

@router.get("/traffic-data", response_model=List[TrafficDataPoint])
async def get_traffic_data(hours: int = 24):
    """Get historical traffic data"""
    try:
        # Load the data file specified in config
        data_file = config.get("DATA_FILE", {}).get("value", "7_days_data.csv")
        if os.path.exists(data_file):
            df = pd.read_csv(data_file)
            
            # If there's a timestamp column, parse it
            if 'timestamp' in df.columns:
                df['timestamp'] = pd.to_datetime(df['timestamp'])
                # Filter for last N hours
                cutoff = datetime.now() - timedelta(hours=hours)
                df = df[df['timestamp'] >= cutoff]
            
            # Return only necessary columns
            if 'http_requests' in df.columns:
                result = []
                for _, row in df.iterrows():
                    result.append({
                        "timestamp": row["timestamp"].strftime('%Y-%m-%d %H:%M:%S') if isinstance(row["timestamp"], pd.Timestamp) else str(row["timestamp"]),
                        "http_requests": int(row["http_requests"])
                    })
                return result
            else:
                raise HTTPException(status_code=400, detail="Data file does not contain 'http_requests' column")
        else:
            raise HTTPException(status_code=404, detail=f"Data file {data_file} not found")
    except Exception as e:
        logger.error(f"Error fetching traffic data: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch traffic data: {str(e)}")

@router.post("/get-predictions", response_model=List[PredictionDataPoint])
async def get_predictions():
    """Generate predictions for next time period"""
    try:
        # This would typically call into your proactive_scaling.py 
        # For now, return empty array as this would require actual model loading
        
        # Placeholder for model prediction integration
        return []
    except Exception as e:
        logger.error(f"Error generating predictions: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate predictions: {str(e)}")

@router.get("/config", response_model=Configuration)
async def get_configuration():
    """Get the current autoscaler configuration"""
    items = []
    for key, data in config.items():
        items.append({
            "key": key,
            "value": data.get("value"),
            "description": data.get("description", "")
        })
    return {"items": items}

@router.post("/config", response_model=Configuration)
async def update_configuration(update: ConfigUpdate = Body(...)):
    """Update a configuration value"""
    key = update.key
    value = update.value
    
    if key not in config:
        raise HTTPException(status_code=404, detail=f"Configuration key '{key}' not found")
    
    # Update the value
    config[key]["value"] = value
    
    # Save the updated configuration
    if save_config():
        return await get_configuration()
    else:
        raise HTTPException(status_code=500, detail="Failed to save configuration")

@router.post("/config/reset", response_model=Configuration)
async def reset_configuration():
    """Reset configuration to defaults"""
    global config
    config = default_config
    
    if save_config():
        return await get_configuration()
    else:
        raise HTTPException(status_code=500, detail="Failed to save default configuration")

@router.get("/deployments")
async def get_deployments():
    """Get the current Kubernetes deployments"""
    try:
        from kubernetes import client, config
        
        try:
            config.load_kube_config()
        except:
            config.load_incluster_config()
            
        apps_v1 = client.AppsV1Api()
        deployments = apps_v1.list_namespaced_deployment(namespace="default")
        
        result = []
        for deploy in deployments.items:
            result.append({
                "name": deploy.metadata.name,
                "replicas": deploy.spec.replicas,
                "available": deploy.status.available_replicas or 0,
                "ready": deploy.status.ready_replicas or 0
            })
        return result
    except Exception as e:
        logger.error(f"Error fetching deployments: {str(e)}")
        # Just return empty array instead of error if k8s not available
        return []








# # autoscaler_metrics.py
# import os
# import logging
# from fastapi import APIRouter, HTTPException
# from pydantic import BaseModel
# from typing import List, Dict, Any, Optional
# import pandas as pd
# from datetime import datetime, timedelta
# import json

# # Configure logging
# logging.basicConfig(level=logging.INFO)
# logger = logging.getLogger(__name__)

# # Create API router
# router = APIRouter(
#     prefix="/autoscaler/metrics",
#     tags=["autoscaler_metrics"],
#     responses={404: {"description": "Not found"}},
# )

# # Models for responses
# class ScalingMetrics(BaseModel):
#     timestamp: str
#     deployment: str
#     replicas: int

# class TrafficDataPoint(BaseModel):
#     timestamp: str
#     http_requests: int

# class PredictionDataPoint(BaseModel):
#     timestamp: str
#     predicted_requests: float

# class ConfigurationItem(BaseModel):
#     key: str
#     value: Any
#     description: str

# class Configuration(BaseModel):
#     items: List[ConfigurationItem]

# # Default configuration
# default_config = {
#     "MODEL_PATH": {"value": "tcn_forecaster.keras", "description": "Path to the trained model file"},
#     "SCALER_PATH": {"value": "scaler.save", "description": "Path to the scaler model"},
#     "DATA_FILE": {"value": "7_days_data.csv", "description": "Path to the traffic data file"},
#     "THRESHOLD": {"value": 310, "description": "Request threshold for scaling up"},
#     "WINDOW_SIZE": {"value": 30, "description": "Window size for model input"},
#     "FORECAST_MINUTES": {"value": 20, "description": "Forecast window in minutes"},
#     "SCALE_UP_REPLICAS": {"value": 3, "description": "Number of replicas when scaling up"},
#     "DEFAULT_REPLICAS": {"value": 1, "description": "Default number of replicas"}
# }

# # Try to load configuration if it exists
# CONFIG_FILE = "autoscaler_config.json"
# config = {}

# try:
#     if os.path.exists(CONFIG_FILE):
#         with open(CONFIG_FILE, 'r') as f:
#             config = json.load(f)
#     else:
#         config = default_config
#         with open(CONFIG_FILE, 'w') as f:
#             json.dump(config, f)
# except Exception as e:
#     logger.error(f"Error loading configuration: {str(e)}")
#     config = default_config

# def save_config():
#     """Save the current configuration to file"""
#     try:
#         with open(CONFIG_FILE, 'w') as f:
#             json.dump(config, f)
#         return True
#     except Exception as e:
#         logger.error(f"Error saving configuration: {str(e)}")
#         return False

# @router.get("/scaling-history", response_model=List[ScalingMetrics])
# async def get_scaling_history(limit: int = 50):
#     """Get the scaling action history"""
#     try:
#         if os.path.exists("scaling_metrics.csv"):
#             df = pd.read_csv("scaling_metrics.csv", names=["timestamp", "deployment", "replicas"])
#             df = df.tail(limit)
            
#             result = []
#             for _, row in df.iterrows():
#                 result.append({
#                     "timestamp": row["timestamp"],
#                     "deployment": row["deployment"],
#                     "replicas": int(row["replicas"])
#                 })
#             return result
#         else:
#             return []
#     except Exception as e:
#         logger.error(f"Error fetching scaling history: {str(e