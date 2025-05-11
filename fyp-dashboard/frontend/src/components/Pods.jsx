import React, { useState, useEffect } from 'react';

function Pods() {
  const [pods, setPods] = useState([]);
  const [replicas, setReplicas] = useState([]);
  const [scalingStatus, setScalingStatus] = useState(null); // To store autoscaling status

  // Styles
  const styles = {
    container: {
      fontFamily: 'Arial, sans-serif',
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '20px',
      backgroundColor: '#f5f5f5',
      borderRadius: '8px',
      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
    },
    header: {
      color: '#2c3e50',
      borderBottom: '2px solid #3498db',
      paddingBottom: '10px',
      marginBottom: '20px',
    },
    list: {
      listStyle: 'none',
      padding: '0',
    },
    listItem: {
      backgroundColor: 'white',
      margin: '10px 0',
      padding: '15px',
      borderRadius: '5px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    podStatus: {
      color: '#fff',
      padding: '3px 8px',
      borderRadius: '4px',
      fontSize: '12px',
      fontWeight: 'bold',
      textTransform: 'uppercase',
    },
    running: {
      backgroundColor: '#2ecc71',
    },
    pending: {
      backgroundColor: '#f39c12',
    },
    error: {
      backgroundColor: '#e74c3c',
    },
    replicaCount: {
      fontWeight: 'bold',
      color: '#3498db',
    },
    section: {
      marginBottom: '40px',
    },
    button: {
      backgroundColor: '#3498db',
      color: 'white',
      padding: '10px 20px',
      border: 'none',
      borderRadius: '5px',
      cursor: 'pointer',
      fontSize: '1em',
      marginBottom: '20px',
    },
    loading: {
      fontStyle: 'italic',
      color: '#e67e22',
    }
  };

  // Determine status color
  const getStatusStyle = (status) => {
    switch (status.toLowerCase()) {
      case 'running':
        return { ...styles.podStatus, ...styles.running };
      case 'pending':
        return { ...styles.podStatus, ...styles.pending };
      default:
        return { ...styles.podStatus, ...styles.error };
    }
  };

  // Fetch data every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetch('http://localhost:8000/pods')
        .then(res => res.json())
        .then(data => setPods(data.pods));

      fetch('http://localhost:8000/replicas')
        .then(res => res.json())
        .then(data => setReplicas(data.replicas));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Function to run autoscaler
  const runAutoscaler = () => {
    setScalingStatus('Scaling in progress...'); // Set status to loading

    fetch('http://localhost:8000/scale', {
      method: 'GET', // Assuming it's a POST request to trigger scaling
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setScalingStatus('Autoscaler ran successfully!');
        } else {
          setScalingStatus('Failed to run autoscaler.');
        }
      })
      .catch((error) => {
        setScalingStatus('Error running autoscaler.');
        console.error('Error:', error);
      });
  };

  return (
    <div style={styles.container}>
      {/* <h1 style={styles.header}>Kubernetes Pods Dashboard</h1> */}

      <div style={styles.section}>
        <h2 style={{ ...styles.header, fontSize: '1.5em' }}>Pods</h2>
        <ul style={styles.list}>
          {pods.map(pod => (
            <li key={pod.name} style={styles.listItem}>
              <div>
                <strong>{pod.name}</strong> 
                <div style={{ color: '#7f8c8d', fontSize: '0.9em' }}>{pod.namespace}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span>IP: {pod.ip}</span>
                <span style={getStatusStyle(pod.status)}>
                  {pod.status}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div style={styles.section}>
        {/* Run Autoscaler Button */}
        <button style={styles.button} onClick={runAutoscaler}>Run Autoscaler</button>
        
        {scalingStatus && <p style={styles.loading}>{scalingStatus}</p>} {/* Display scaling status */}
        
        <h2 style={{ ...styles.header, fontSize: '1.5em' }}>Deployments</h2>
        <ul style={styles.list}>
          {replicas.map(deploy => (
            <li key={deploy.name} style={styles.listItem}>
              <div>
                <strong>{deploy.name}</strong>
                <div style={{ color: '#7f8c8d', fontSize: '0.9em' }}>{deploy.namespace}</div>
              </div>
              <div style={styles.replicaCount}>
                Replicas: <span style={{ color: deploy.current === deploy.desired ? '#2ecc71' : '#e74c3c' }}>
                  {deploy.current}/{deploy.desired}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default Pods;





// import React, { useState, useEffect } from 'react';

// function Pods() {
//   const [pods, setPods] = useState([]);
//   const [replicas, setReplicas] = useState([]);

//   // Styles
//   const styles = {
//     container: {
//       fontFamily: 'Arial, sans-serif',
//       maxWidth: '1200px',
//       margin: '0 auto',
//       padding: '20px',
//       backgroundColor: '#f5f5f5',
//       borderRadius: '8px',
//       boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
//     },
//     header: {
//       color: '#2c3e50',
//       borderBottom: '2px solid #3498db',
//       paddingBottom: '10px',
//       marginBottom: '20px',
//     },
//     list: {
//       listStyle: 'none',
//       padding: '0',
//     },
//     listItem: {
//       backgroundColor: 'white',
//       margin: '10px 0',
//       padding: '15px',
//       borderRadius: '5px',
//       boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
//       display: 'flex',
//       justifyContent: 'space-between',
//       alignItems: 'center',
//     },
//     podStatus: {
//       color: '#fff',
//       padding: '3px 8px',
//       borderRadius: '4px',
//       fontSize: '12px',
//       fontWeight: 'bold',
//       textTransform: 'uppercase',
//     },
//     running: {
//       backgroundColor: '#2ecc71',
//     },
//     pending: {
//       backgroundColor: '#f39c12',
//     },
//     error: {
//       backgroundColor: '#e74c3c',
//     },
//     replicaCount: {
//       fontWeight: 'bold',
//       color: '#3498db',
//     },
//     section: {
//       marginBottom: '40px',
//     },
//   };

//   // Determine status color
//   const getStatusStyle = (status) => {
//     switch (status.toLowerCase()) {
//       case 'running':
//         return { ...styles.podStatus, ...styles.running };
//       case 'pending':
//         return { ...styles.podStatus, ...styles.pending };
//       default:
//         return { ...styles.podStatus, ...styles.error };
//     }
//   };

//   // Fetch data every 5 seconds
//   useEffect(() => {
//     const interval = setInterval(() => {
//       fetch('http://localhost:8000/pods')
//         .then(res => res.json())
//         .then(data => setPods(data.pods));

//       fetch('http://localhost:8000/replicas')
//         .then(res => res.json())
//         .then(data => setReplicas(data.replicas));
//     }, 5000);

//     return () => clearInterval(interval);
//   }, []);
  

//   return (
//     <div style={styles.container}>
//       {/* <h1 style={styles.header}>Kubernetes Pods Dashboard</h1> */}
      
//       <div style={styles.section}>
//         <h2 style={{ ...styles.header, fontSize: '1.5em' }}>Pods</h2>
//         <ul style={styles.list}>
//           {pods.map(pod => (
//             <li key={pod.name} style={styles.listItem}>
//               <div>
//                 <strong>{pod.name}</strong> 
//                 <div style={{ color: '#7f8c8d', fontSize: '0.9em' }}>{pod.namespace}</div>
//               </div>
//               <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
//                 <span>IP: {pod.ip}</span>
//                 <span style={getStatusStyle(pod.status)}>
//                   {pod.status}
//                 </span>
//               </div>
//             </li>
//           ))}
//         </ul>
//       </div>

//       <div style={styles.section}>
//         <button onClick={}>Run Autoscaler</button>
//         <h2 style={{ ...styles.header, fontSize: '1.5em' }}>Deployments</h2>
//         <ul style={styles.list}>
//           {replicas.map(deploy => (
//             <li key={deploy.name} style={styles.listItem}>
//               <div>
//                 <strong>{deploy.name}</strong>
//                 <div style={{ color: '#7f8c8d', fontSize: '0.9em' }}>{deploy.namespace}</div>
//               </div>
//               <div style={styles.replicaCount}>
//                 Replicas: <span style={{ color: deploy.current === deploy.desired ? '#2ecc71' : '#e74c3c' }}>
//                   {deploy.current}/{deploy.desired}
//                 </span>
//               </div>
//             </li>
//           ))}
//         </ul>
//       </div>
//     </div>
//   );
// }

// export default Pods;




// // Dashboard.jsx
// import React, { useState, useEffect } from 'react';

// function Dashboard() {
//   const [pods, setPods] = useState([]);
//   const [replicas, setReplicas] = useState([]);

//   // Fetch data every 5 seconds
//   useEffect(() => {
//     const interval = setInterval(() => {
//       fetch('http://localhost:8000/pods')
//         .then(res => res.json())
//         .then(data => setPods(data.pods));

//       fetch('http://localhost:8000/replicas')
//         .then(res => res.json())
//         .then(data => setReplicas(data.replicas));
//     }, 5000);

//     return () => clearInterval(interval);
//   }, []);

//   return (
//     <div>
//       <h1>Kubernetes Pods</h1>
//       <ul>
//         {pods.map(pod => (
//           <li key={pod.name}>
//             {pod.name} (Status: {pod.status}, IP: {pod.ip})
//           </li>
//         ))}
//       </ul>

//       <h1>Deployment Replicas</h1>
//       <ul>
//         {replicas.map(deploy => (
//           <li key={deploy.name}>
//             {deploy.name}: {deploy.current}/{deploy.desired} replicas ready
//           </li>
//         ))}
//       </ul>
//     </div>
//   );
// }

// export default Dashboard;