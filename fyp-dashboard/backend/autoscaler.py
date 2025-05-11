# autoscaler.py
import os
import asyncio
import logging
from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import importlib.util
import sys

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("api_scaling_actions.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Create API router
router = APIRouter(
    prefix="/autoscaler",
    tags=["autoscaler"],
    responses={404: {"description": "Not found"}},
)

# Model for response
class ScalingResponse(BaseModel):
    status: str
    message: str
    task_id: Optional[str] = None

# Track background tasks
scaling_tasks = {}
scaling_status = {}

async def run_scaling_script():
    """Run the proactive scaling script in the background"""
    try:
        # Import the proactive_scaling module
        spec = importlib.util.spec_from_file_location("proactive_scaling", "proactive_scaling.py")
        proactive_scaling = importlib.util.module_from_spec(spec)
        sys.modules["proactive_scaling"] = proactive_scaling
        spec.loader.exec_module(proactive_scaling)
        
        # Run the scaling logic
        logger.info("Starting proactive scaling")
        proactive_scaling.scaling_logic()
        logger.info("Completed proactive scaling")
        return True
    except Exception as e:
        logger.error(f"Failed to run proactive scaling: {str(e)}")
        return False

async def continuous_scaling_task(task_id: str, interval_seconds: int = 30):
    """Run the scaling logic continuously at specified intervals"""
    scaling_status[task_id] = "running"
    try:
        while scaling_status.get(task_id) == "running":
            success = await run_scaling_script()
            if not success:
                logger.error(f"Task {task_id}: Scaling execution failed")
            await asyncio.sleep(interval_seconds)
    except asyncio.CancelledError:
        logger.info(f"Task {task_id} was cancelled")
        scaling_status[task_id] = "cancelled"
    except Exception as e:
        logger.error(f"Task {task_id} failed: {str(e)}")
        scaling_status[task_id] = "failed"

@router.post("/start", response_model=ScalingResponse)
async def start_autoscaler(background_tasks: BackgroundTasks):
    """Start the autoscaler in the background"""
    # Generate a unique task ID
    task_id = f"scaling-{len(scaling_tasks) + 1}"
    
    # Create and store the task
    task = asyncio.create_task(continuous_scaling_task(task_id))
    scaling_tasks[task_id] = task
    
    return ScalingResponse(
        status="started",
        message="Autoscaler started successfully",
        task_id=task_id
    )

@router.post("/stop/{task_id}", response_model=ScalingResponse)
async def stop_autoscaler(task_id: str):
    """Stop a running autoscaler task"""
    if task_id not in scaling_tasks:
        raise HTTPException(status_code=404, detail=f"Task {task_id} not found")
    
    task = scaling_tasks[task_id]
    if not task.done():
        scaling_status[task_id] = "stopping"
        task.cancel()
        
    return ScalingResponse(
        status="stopped",
        message=f"Autoscaler task {task_id} stopped",
        task_id=task_id
    )

@router.post("/run-once", response_model=ScalingResponse)
async def run_once():
    """Run the autoscaler once"""
    success = await run_scaling_script()
    
    if success:
        return ScalingResponse(
            status="completed",
            message="Autoscaler executed successfully"
        )
    else:
        raise HTTPException(
            status_code=500, 
            detail="Failed to execute autoscaler"
        )

@router.get("/status", response_model=Dict[str, str])
async def get_scaling_status():
    """Get the status of all scaling tasks"""
    return scaling_status

# Add this to your main FastAPI app
# from autoscaler import router as autoscaler_router
# app.include_router(autoscaler_router)