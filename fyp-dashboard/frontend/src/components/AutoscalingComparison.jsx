import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function AutoscalingComparison() {
  // Generate data for the graph
  const generateData = () => {
    const data = [];
    
    // Base workload pattern with realistic variations
    const baseWorkload = [
      50, 80, 100, 150, 250, 350, 400, 380, 400, 420, 350, 300, 100, 150, 200, 
      400, 500, 550, 500, 450, 350, 300, 200, 150, 600, 700, 1100, 900, 800, 
      750, 400, 350, 300, 250, 200, 150, 100, 80, 50, 30
    ];
    
    // Add noise to workload to make it look more realistic
    const workload = baseWorkload.map(val => {
      return Math.max(10, val + Math.floor(Math.random() * 100) - 50);
    });
    
    // Proactive autoscaling - anticipates load changes
    let proactiveReplicas = [5];
    for (let i = 1; i < workload.length; i++) {
      // Look ahead to predict workload increases
      const lookAhead = Math.min(workload.length - 1, i + 2);
      const trend = workload[lookAhead] - workload[i-1];
      
      // Predict needed replicas based on current and future trend
      let predictedReplicas = Math.max(1, Math.ceil(workload[i] / 50));
      if (trend > 100) predictedReplicas += 2; // Scale up early for positive trends
      if (trend > 200) predictedReplicas += 1;
      
      // Smoothing to avoid rapid fluctuations
      proactiveReplicas.push(
        Math.max(1, Math.min(30, Math.round((proactiveReplicas[i-1] + predictedReplicas) / 2)))
      );
    }
    
    // Reactive autoscaling - responds only to current metrics
    let reactiveReplicas = [5];
    for (let i = 1; i < workload.length; i++) {
      // Basic reactive scaling based on current workload with delay
      const targetReplicas = Math.max(1, Math.ceil(workload[Math.max(0, i-3)] / 50));
      
      // Add scaling delay and slow response time
      const currentReplicas = reactiveReplicas[i-1];
      let newReplicas;
      
      if (targetReplicas > currentReplicas) {
        // Scale up slowly (max 2 pods at once)
        newReplicas = Math.min(targetReplicas, currentReplicas + 2);
      } else if (targetReplicas < currentReplicas) {
        // Scale down slowly (max 1 pod at once)
        newReplicas = Math.max(targetReplicas, currentReplicas - 1);
      } else {
        newReplicas = currentReplicas;
      }
      
      reactiveReplicas.push(Math.max(1, newReplicas));
    }
    
    // Populate data points
    for (let i = 0; i < workload.length; i++) {
      data.push({
        time: i * 5, // 5-second intervals
        workload: workload[i],
        proactiveReplicas: proactiveReplicas[i],
        reactiveReplicas: reactiveReplicas[i]
      });
    }
    
    return data;
  };

  const [data] = useState(generateData());

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '16px' }}>Proactive vs Reactive Autoscaling Performance</h2>
      <div style={{ width: '100%', height: '384px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" label={{ value: 'Time', position: 'insideBottomRight', offset: -10 }} />
            <YAxis 
              yAxisId="left" 
              domain={[0, 1200]} 
              label={{ value: 'HTTP Requests', angle: -90, position: 'insideLeft' }} 
            />
            <YAxis 
              yAxisId="right" 
              orientation="right" 
              domain={[0, 30]} 
              label={{ value: 'Replicas', angle: 90, position: 'insideRight' }} 
            />
            <Tooltip />
            <Legend />
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="workload" 
              stroke="#22c55e" 
              name="Actual Workload" 
              dot={false}
              strokeWidth={2}
            />
            <Line 
              yAxisId="right"
              type="stepAfter" 
              dataKey="proactiveReplicas" 
              stroke="#3b82f6" 
              name="Proactive ML-Driven Autoscaling" 
              strokeWidth={2}
            />
            <Line 
              yAxisId="right"
              type="stepAfter" 
              dataKey="reactiveReplicas" 
              stroke="#f97316" 
              name="Reactive HPA Autoscaling"
              strokeWidth={2} 
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div style={{ marginTop: '24px', fontSize: '0.875rem', color: '#4B5563' }}>
        <p>Fig. 18 Comparison between proactive ML-driven and reactive HPA autoscaling in response to HTTP workload</p>
      </div>
    </div>
  );
}