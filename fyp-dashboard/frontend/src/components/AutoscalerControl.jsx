// AutoscalerControl.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AutoscalerControl = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [currentTaskId, setCurrentTaskId] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [taskStatuses, setTaskStatuses] = useState({});

  // API endpoint (adjust to match your FastAPI base URL)
  const API_BASE_URL = '/api/autoscaler';

  // Fetch current status of scaling tasks
  const fetchStatus = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/status`);
      setTaskStatuses(response.data);
      
      // Check if our current task is still running
      if (currentTaskId && response.data[currentTaskId] === 'running') {
        setIsRunning(true);
      } else if (currentTaskId && response.data[currentTaskId] !== 'running') {
        setIsRunning(false);
      }
    } catch (error) {
      console.error('Error fetching autoscaler status:', error);
    }
  };

  // Start continuous autoscaling
  const startAutoscaler = async () => {
    setIsLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/start`);
      setCurrentTaskId(response.data.task_id);
      setIsRunning(true);
      setStatusMessage('Autoscaler running');
    } catch (error) {
      console.error('Error starting autoscaler:', error);
      setStatusMessage(`Error: ${error.response?.data?.detail || error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Stop current autoscaling task
  const stopAutoscaler = async () => {
    if (!currentTaskId) return;
    
    setIsLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/stop/${currentTaskId}`);
      setIsRunning(false);
      setStatusMessage('Autoscaler stopped');
    } catch (error) {
      console.error('Error stopping autoscaler:', error);
      setStatusMessage(`Error: ${error.response?.data?.detail || error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Run autoscaler once
  const runOnce = async () => {
    setIsLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/run-once`);
      setStatusMessage('Autoscaler executed once successfully');
    } catch (error) {
      console.error('Error running autoscaler:', error);
      setStatusMessage(`Error: ${error.response?.data?.detail || error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Poll for status updates
  useEffect(() => {
    fetchStatus();
    const intervalId = setInterval(fetchStatus, 5000);
    
    return () => clearInterval(intervalId);
  }, [currentTaskId]);

  return (
    <div className="autoscaler-control p-4 border rounded shadow-sm bg-white">
      <h2 className="text-xl font-bold mb-4">Proactive Autoscaler</h2>
      
      <div className="mb-4">
        <div className="flex space-x-3 mb-3">
          {isRunning ? (
            <button
              onClick={stopAutoscaler}
              disabled={isLoading}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
            >
              Stop Autoscaler
            </button>
          ) : (
            <button
              onClick={startAutoscaler}
              disabled={isLoading}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
            >
              Start Autoscaler
            </button>
          )}
          
          <button
            onClick={runOnce}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            Run Once
          </button>
        </div>
        
        {/* Status indicator */}
        <div className="flex items-center mb-2">
          <div 
            className={`w-3 h-3 rounded-full mr-2 ${isRunning ? 'bg-green-500' : 'bg-gray-400'}`}
          ></div>
          <span>
            Status: {isRunning ? 'Running' : 'Stopped'}
          </span>
        </div>
        
        {statusMessage && (
          <div className="text-sm text-gray-600 mt-2">{statusMessage}</div>
        )}
      </div>
      
      {/* Show task statuses if there are any */}
      {Object.keys(taskStatuses).length > 0 && (
        <div className="mt-4">
          <h3 className="text-lg font-semibold mb-2">Task Statuses</h3>
          <ul className="text-sm">
            {Object.entries(taskStatuses).map(([taskId, status]) => (
              <li key={taskId} className="mb-1">
                <span className="font-medium">{taskId}:</span> {status}
                {taskId === currentTaskId && " (current)"}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default AutoscalerControl;