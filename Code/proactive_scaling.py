
import os
import logging
import numpy as np
import pandas as pd
from datetime import datetime
from kubernetes import client, config
from tensorflow.keras.models import load_model
import joblib
from tcn import TCN

# Configuration
MODEL_PATH = 'tcn_forecaster.keras'
SCALER_PATH = 'scaler.save'
DATA_FILE = '7_days_data.csv'
THRESHOLD = 320
WINDOW_SIZE = 30
FORECAST_MINUTES = 20
SCALE_UP_REPLICAS = 3
DEFAULT_REPLICAS = 1
INDEX_FILE = 'last_index.txt'

# Initialize logging
logger = logging.getLogger(__name__)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("scaling_actions.log"),
        logging.StreamHandler()
    ]
)

# Global variable to track processing position
PROCESSED_INDEX = 0

def initialize_processed_index():
    """Load or reset the processing index"""
    global PROCESSED_INDEX
    if os.path.exists(INDEX_FILE):
        with open(INDEX_FILE, 'r') as f:
            PROCESSED_INDEX = int(f.read().strip())
    else:
        PROCESSED_INDEX = 0
        with open(INDEX_FILE, 'w') as f:
            f.write(str(PROCESSED_INDEX))

def get_next_window():
    """Get next sequential window of data"""
    global PROCESSED_INDEX
    
    try:
        df = pd.read_csv(DATA_FILE, parse_dates=['timestamp'])
        df = df.sort_values('timestamp')
        
        if PROCESSED_INDEX + WINDOW_SIZE > len(df):
            logger.warning("End of dataset reached")
            return None
            
        window_data = df.iloc[PROCESSED_INDEX:PROCESSED_INDEX+WINDOW_SIZE]
        values = window_data['http_requests'].values
        
        # Update and save index
        PROCESSED_INDEX += WINDOW_SIZE
        with open(INDEX_FILE, 'w') as f:
            f.write(str(PROCESSED_INDEX))
            
        logger.info(f"Processing window {PROCESSED_INDEX-WINDOW_SIZE}-{PROCESSED_INDEX-1}")
        return values
        
    except Exception as e:
        logger.error(f"Data loading failed: {str(e)}")
        return None



import os
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'

import logging
import numpy as np
import pandas as pd
from datetime import datetime
from kubernetes import client, config
from tensorflow.keras.models import load_model
import joblib
from tcn import TCN

# Configuration
MODEL_PATH = 'tcn_forecaster.keras'
SCALER_PATH = 'scaler.save'
DATA_FILE = '7_days_data.csv'
THRESHOLD = 310
WINDOW_SIZE = 30  # Must match model's trained architecture
FORECAST_MINUTES = 20
SCALE_UP_REPLICAS = 3
DEFAULT_REPLICAS = 1
INDEX_FILE = 'last_index.txt'

# Initialize logging
logger = logging.getLogger(__name__)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("scaling_actions.log"),
        logging.StreamHandler()
    ]
)

# Global variable to track processing position
PROCESSED_INDEX = 0

def initialize_processed_index():
    """Load or reset the processing index"""
    global PROCESSED_INDEX
    if os.path.exists(INDEX_FILE):
        with open(INDEX_FILE, 'r') as f:
            content = f.read().strip()
            PROCESSED_INDEX = int(content) if content else 0
    else:
        PROCESSED_INDEX = 0
        with open(INDEX_FILE, 'w') as f:
            f.write(str(PROCESSED_INDEX))

def get_next_window():
    """Get next sequential window of data"""
    global PROCESSED_INDEX
    
    try:
        df = pd.read_csv(DATA_FILE, parse_dates=['timestamp'])
        df = df.sort_values('timestamp')
        
        if PROCESSED_INDEX + WINDOW_SIZE > len(df):
            logger.warning("End of dataset reached")
            return None
            
        window_data = df.iloc[PROCESSED_INDEX:PROCESSED_INDEX+WINDOW_SIZE]
        values = window_data['http_requests'].values
        
        # Update and save index
        PROCESSED_INDEX += WINDOW_SIZE
        with open(INDEX_FILE, 'w') as f:
            f.write(str(PROCESSED_INDEX))
            
        logger.info(f"Processing window {PROCESSED_INDEX-WINDOW_SIZE}-{PROCESSED_INDEX-1}")
        return values
        
    except Exception as e:
        logger.error(f"Data loading failed: {str(e)}")
        return None
def get_all_deployments():
    """Get list of all deployments in default namespace"""
    try:
        config.load_kube_config()
        apps_v1 = client.AppsV1Api()
        return [deploy.metadata.name for deploy in apps_v1.list_namespaced_deployment(namespace="default").items]
    except Exception as e:
        logger.error(f"Failed to get deployments: {str(e)}")
        return []

def scale_all_deployments(target_replicas):
    """Scale all deployments to specified replica count"""
    config.load_kube_config()
    apps_v1 = client.AppsV1Api()
    deployments = get_all_deployments()
    
    for deploy_name in deployments:
        try:
            body = {'spec': {'replicas': target_replicas}}
            apps_v1.patch_namespaced_deployment(
                name=deploy_name,
                namespace="default",
                body=body
            )
            logger.info(f"Scaled {deploy_name} to {target_replicas} replicas")
            log_metrics(deploy_name, target_replicas)
        except Exception as e:
            logger.error(f"Failed to scale {deploy_name}: {str(e)}")

def make_prediction(data):
    """Generate workload forecast"""
    try:
        scaler = joblib.load(SCALER_PATH)
        model = load_model(MODEL_PATH, custom_objects={'TCN': TCN})
        
        scaled_data = scaler.transform(data.reshape(-1, 1))
        input_data = scaled_data.reshape(1, WINDOW_SIZE, 1)
        scaled_pred = model.predict(input_data)
        return scaler.inverse_transform(scaled_pred).flatten()
    except Exception as e:
        logger.error(f"Prediction failed: {str(e)}")
        return None

def log_metrics(deployment, replicas):
    """Record scaling decision metrics"""
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    with open("scaling_metrics.csv", "a") as f:
        f.write(f"{timestamp},{deployment},{replicas}\n")

def scaling_logic():
    """Main decision-making logic"""
    initialize_processed_index()
    current_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    logger.info(f"Starting scaling check at {current_time}")
    
    data = get_next_window()
    if data is None:
        logger.warning("No data available for processing")
        return

    logger.debug(f"Window data: {data[-5:]}...")  # Show last 5 values
    
    predictions = make_prediction(data)
    if predictions is None:
        return

    avg_prediction = np.mean(predictions[:FORECAST_MINUTES])
    logger.info(f"Predicted average requests: {avg_prediction:.2f} (Threshold: {THRESHOLD})")

    try:
        if avg_prediction > THRESHOLD:
            scale_all_deployments(SCALE_UP_REPLICAS)
        else:
            scale_all_deployments(DEFAULT_REPLICAS)
    except Exception as e:
        logger.error(f"Scaling logic failed: {str(e)}")

if __name__ == "__main__":
    scaling_logic()









# import logging
# import numpy as np
# import pandas as pd
# from datetime import datetime, timedelta
# from kubernetes import client, config
# from tensorflow.keras.models import load_model
# import joblib
# from tcn import TCN

# # Configuration
# MODEL_PATH = 'tcn_forecaster.keras'
# SCALER_PATH = 'scaler_1.save'
# DATA_FILE = '7_days_data.csv'
# THRESHOLD = 320
# WINDOW_SIZE = 60
# FORECAST_MINUTES = 20
# SCALE_UP_REPLICAS = 3
# DEFAULT_REPLICAS = 1

# # Initialize logging
# logger = logging.getLogger(__name__)
# logging.basicConfig(
#     level=logging.INFO,
#     format='%(asctime)s - %(levelname)s - %(message)s',
#     handlers=[
#         logging.FileHandler("scaling_actions.log"),
#         logging.StreamHandler()
#     ]
# )

# def get_all_deployments():
#     """Get list of all deployments in default namespace"""
#     try:
#         config.load_kube_config()
#         apps_v1 = client.AppsV1Api()
#         return [deploy.metadata.name for deploy in apps_v1.list_namespaced_deployment(namespace="default").items]
#     except Exception as e:
#         logger.error(f"Failed to get deployments: {str(e)}")
#         return []

# def scale_all_deployments(target_replicas):
#     """Scale all deployments to specified replica count"""
#     config.load_kube_config()
#     apps_v1 = client.AppsV1Api()
#     deployments = get_all_deployments()
    
#     for deploy_name in deployments:
#         try:
#             body = {'spec': {'replicas': target_replicas}}
#             apps_v1.patch_namespaced_deployment(
#                 name=deploy_name,
#                 namespace="default",
#                 body=body
#             )
#             logger.info(f"Scaled {deploy_name} to {target_replicas} replicas")
#             log_metrics(deploy_name, target_replicas)
#         except Exception as e:
#             logger.error(f"Failed to scale {deploy_name}: {str(e)}")

# def get_latest_data():
#     """Retrieve last hour of metrics data"""
#     try:
#         df = pd.read_csv(DATA_FILE, parse_dates=['timestamp'])
#         df = df.sort_values('timestamp').tail(WINDOW_SIZE)
#         if len(df) < WINDOW_SIZE:
#             logger.warning(f"Only {len(df)} records available, need {WINDOW_SIZE}")
#             return None
#         return df['http_requests'].values[-WINDOW_SIZE:]
#     except Exception as e:
#         logger.error(f"Data loading failed: {str(e)}")
#         return None

# def make_prediction(data):
#     """Generate workload forecast"""
#     try:
#         scaler = joblib.load(SCALER_PATH)
#         model = load_model(MODEL_PATH, custom_objects={'TCN': TCN})
        
#         scaled_data = scaler.transform(data.reshape(-1, 1))
#         input_data = scaled_data.reshape(1, WINDOW_SIZE, 1)
#         scaled_pred = model.predict(input_data)
#         return scaler.inverse_transform(scaled_pred).flatten()
#     except Exception as e:
#         logger.error(f"Prediction failed: {str(e)}")
#         return None

# def log_metrics(deployment, replicas):
#     """Record scaling decision metrics"""
#     timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
#     with open("scaling_metrics.csv", "a") as f:
#         f.write(f"{timestamp},{deployment},{replicas}\n")

# def scaling_logic():
#     """Main decision-making logic"""
#     current_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
#     logger.info(f"Starting scaling check at {current_time}")
    
#     data = get_latest_data()
#     if data is None:
#         return

#     predictions = make_prediction(data)
#     if predictions is None:
#         return

#     avg_prediction = np.mean(predictions[:FORECAST_MINUTES])
#     logger.info(f"Predicted average requests: {avg_prediction:.2f} (Threshold: {THRESHOLD})")

#     try:
#         if avg_prediction > THRESHOLD:
#             scale_all_deployments(SCALE_UP_REPLICAS)
#         else:
#             scale_all_deployments(DEFAULT_REPLICAS)
#     except Exception as e:
#         logger.error(f"Scaling logic failed: {str(e)}")

# if __name__ == "__main__":
#     scaling_logic()

