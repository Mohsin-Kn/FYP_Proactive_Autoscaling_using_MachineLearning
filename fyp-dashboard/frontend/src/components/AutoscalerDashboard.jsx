import { useState, useEffect } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ResponsiveContainer 
} from 'recharts';
import { 
  Activity, 
  Power, 
  Play, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw, 
  Info 
} from 'lucide-react';

export default function AutoscalerDashboard() {
  const [isRunning, setIsRunning] = useState(false);
  const [currentTaskId, setCurrentTaskId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [metricsData, setMetricsData] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [threshold, setThreshold] = useState(310);
  const [deploymentStatus, setDeploymentStatus] = useState([]);
  
  // Mock data for demo purposes - replace with real API calls
  useEffect(() => {
    // Simulated metrics data
    const mockMetrics = Array(24).fill().map((_, i) => ({
      time: `${i}:00`,
      requests: Math.floor(Math.random() * 300) + 50,
      replicas: Math.floor(Math.random() * 3) + 1
    }));
    setMetricsData(mockMetrics);
    
    // Simulated predictions
    const mockPredictions = Array(6).fill().map((_, i) => ({
      time: `+${i*10}min`,
      predicted: Math.floor(Math.random() * 350) + 100
    }));
    setPredictions(mockPredictions);
    
    // Simulated deployment status
    setDeploymentStatus([
      { name: 'frontend', replicas: 3, status: 'Ready' },
      { name: 'api-service', replicas: 3, status: 'Ready' },
      { name: 'cache', replicas: 2, status: 'Ready' },
      { name: 'database', replicas: 1, status: 'Ready' }
    ]);
  }, []);
  
  const startAutoscaler = () => {
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsRunning(true);
      setCurrentTaskId('scaling-1');
      setStatusMessage('Autoscaler running');
      setIsLoading(false);
    }, 800);
  };
  
  const stopAutoscaler = () => {
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsRunning(false);
      setStatusMessage('Autoscaler stopped');
      setIsLoading(false);
    }, 800);
  };
  
  const runOnce = () => {
    setIsLoading(true);
    setStatusMessage('Executing scaling check...');
    
    // Simulate API call
    setTimeout(() => {
      setStatusMessage('Scaling check completed');
      setIsLoading(false);
    }, 1500);
  };
  
  return (
    <div className="w-full p-6 bg-gray-50 rounded-lg">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Activity className="w-6 h-6 mr-2 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-800">Proactive Autoscaler Dashboard</h1>
        </div>
        
        <div className="flex space-x-2">
          {isRunning ? (
            <button
              onClick={stopAutoscaler}
              disabled={isLoading}
              className="flex items-center px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
            >
              <Power className="w-4 h-4 mr-1" />
              Stop Autoscaler
            </button>
          ) : (
            <button
              onClick={startAutoscaler}
              disabled={isLoading}
              className="flex items-center px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
            >
              <Power className="w-4 h-4 mr-1" />
              Start Autoscaler
            </button>
          )}
          
          <button
            onClick={runOnce}
            disabled={isLoading}
            className="flex items-center px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            <Play className="w-4 h-4 mr-1" />
            Run Once
          </button>
        </div>
      </div>
      
      {/* Status bar */}
      <div className="p-4 mb-6 bg-white rounded-lg shadow">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-2 ${isRunning ? 'bg-green-500' : 'bg-gray-400'}`}></div>
            <span className="font-medium">
              Status: {isRunning ? 'Active' : 'Inactive'}
            </span>
            {currentTaskId && (
              <span className="ml-2 text-sm text-gray-500">
                Task ID: {currentTaskId}
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-1 text-gray-500" />
              <span className="text-sm">Check interval: 30s</span>
            </div>
            
            <div className="flex items-center">
              <AlertTriangle className="w-4 h-4 mr-1 text-yellow-500" />
              <span className="text-sm">Threshold: {threshold} req/min</span>
            </div>
          </div>
        </div>
        
        {statusMessage && (
          <div className="mt-2 text-sm text-gray-600">{statusMessage}</div>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Traffic and Replicas Chart */}
        <div className="md:col-span-2 p-4 bg-white rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Traffic & Scaling History</h2>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart
              data={metricsData}
              margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Line 
                yAxisId="left" 
                type="monotone" 
                dataKey="requests" 
                stroke="#3b82f6" 
                name="HTTP Requests" 
              />
              <Line 
                yAxisId="right" 
                type="stepAfter" 
                dataKey="replicas" 
                stroke="#10b981" 
                name="Pod Replicas" 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        {/* Deployments Status */}
        <div className="p-4 bg-white rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Deployment Status</h2>
          <div className="space-y-3">
            {deploymentStatus.map((deploy) => (
              <div key={deploy.name} className="flex items-center justify-between p-2 border-b">
                <div>
                  <div className="font-medium">{deploy.name}</div>
                  <div className="text-sm text-gray-500">
                    {deploy.replicas} {deploy.replicas === 1 ? 'replica' : 'replicas'}
                  </div>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 mr-1 text-green-500" />
                  <span className="text-sm text-green-500">{deploy.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Predictions */}
        <div className="p-4 bg-white rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-3">Traffic Predictions</h2>
          <div className="text-sm text-gray-500 mb-2 flex items-center">
            <Info className="w-4 h-4 mr-1" />
            Next {predictions.length * 10} minutes forecast
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart
              data={predictions}
              margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="predicted" 
                stroke="#8b5cf6" 
                name="Predicted Traffic" 
              />
              {/* Draw threshold line */}
              <Line 
                type="monotone" 
                dataKey={() => threshold} 
                stroke="#ef4444" 
                strokeDasharray="5 5" 
                name="Scaling Threshold"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        {/* Scaling Log */}
        <div className="md:col-span-2 p-4 bg-white rounded-lg shadow">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Scaling Actions Log</h2>
            <button className="flex items-center text-blue-500 text-sm">
              <RefreshCw className="w-3 h-3 mr-1" />
              Refresh
            </button>
          </div>
          <div className="max-h-60 overflow-y-auto text-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deployment</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  <td className="px-4 py-2">12:45:30</td>
                  <td className="px-4 py-2">frontend</td>
                  <td className="px-4 py-2 text-green-500">Scale Up</td>
                  <td className="px-4 py-2">1 → 3 replicas</td>
                </tr>
                <tr>
                  <td className="px-4 py-2">12:45:30</td>
                  <td className="px-4 py-2">api-service</td>
                  <td className="px-4 py-2 text-green-500">Scale Up</td>
                  <td className="px-4 py-2">1 → 3 replicas</td>
                </tr>
                <tr>
                  <td className="px-4 py-2">12:15:30</td>
                  <td className="px-4 py-2">frontend</td>
                  <td className="px-4 py-2 text-red-500">Scale Down</td>
                  <td className="px-4 py-2">3 → 1 replicas</td>
                </tr>
                <tr>
                  <td className="px-4 py-2">12:15:30</td>
                  <td className="px-4 py-2">api-service</td>
                  <td className="px-4 py-2 text-red-500">Scale Down</td>
                  <td className="px-4 py-2">3 → 1 replicas</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Configuration */}
        <div className="p-4 bg-white rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Configuration</h2>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="text-sm text-gray-500">Model Path:</div>
              <div className="text-sm font-mono">tcn_forecaster.keras</div>
              
              <div className="text-sm text-gray-500">Data File:</div>
              <div className="text-sm font-mono">7_days_data.csv</div>
              
              <div className="text-sm text-gray-500">Window Size:</div>
              <div className="text-sm">30 points</div>
              
              <div className="text-sm text-gray-500">Forecast:</div>
              <div className="text-sm">20 minutes ahead</div>
              
              <div className="text-sm text-gray-500">Threshold:</div>
              <div className="flex items-center">
                <input 
                  type="number" 
                  className="w-16 py-1 px-2 border rounded text-sm" 
                  value={threshold}
                  onChange={(e) => setThreshold(parseInt(e.target.value))}
                />
                <span className="ml-1 text-xs text-gray-500">req/min</span>
              </div>
              
              <div className="text-sm text-gray-500">Scale Up To:</div>
              <div className="text-sm">3 replicas</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}