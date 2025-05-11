import React, { useState, useEffect } from 'react';

import AutoscalerControl from './AutoscalerControl';
import AutoscalerDashboard from './AutoscalerDashboard';

function Home() {
  const [stats, setStats] = useState({
    totalPods: 0,
    totalDeployments: 0,
    deployments: []
  });

  // Styles
  const styles = {
    container: {
    //   fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '20px',
      backgroundColor: '#f8f9fa',
      minHeight: '100vh',
    },
    header: {
      color: '#343a40',
      textAlign: 'center',
      marginBottom: '40px',
      fontSize: '2.5rem',
      fontWeight: '300',
      letterSpacing: '1px'
    },
    cardsContainer: {
      display: 'flex',
      justifyContent: 'space-around',
      flexWrap: 'wrap',
      gap: '20px',
      marginBottom: '40px'
    },
    card: {
      backgroundColor: 'white',
      borderRadius: '10px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      padding: '25px',
      width: '300px',
      textAlign: 'center',
      transition: 'transform 0.3s ease',
      ':hover': {
        transform: 'translateY(-5px)'
      }
    },
    cardTitle: {
      color: '#6c757d',
      fontSize: '1.2rem',
      marginBottom: '15px'
    },
    cardValue: {
      color: '#212529',
      fontSize: '2.5rem',
      fontWeight: 'bold',
      margin: '10px 0'
    },
    deploymentsContainer: {
      backgroundColor: 'white',
      borderRadius: '10px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      padding: '25px'
    },
    deploymentItem: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '15px 0',
      borderBottom: '1px solid #e9ecef'
    },
    deploymentName: {
      fontWeight: '600',
      color: '#495057'
    },
    replicaCount: {
      display: 'flex',
      alignItems: 'center'
    },
    replicaNumber: {
      backgroundColor: '#e9ecef',
      borderRadius: '50%',
      width: '30px',
      height: '30px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: '10px',
      fontWeight: 'bold'
    },
    healthy: {
      color: '#28a745'
    },
    warning: {
      color: '#ffc107'
    },
    danger: {
      color: '#dc3545'
    }
  };

  // Fetch data
  useEffect(() => {
    const fetchData = () => {
      Promise.all([
        fetch('http://localhost:8000/pods'),
        fetch('http://localhost:8000/replicas')
      ])
      .then(([podsRes, replicasRes]) => 
        Promise.all([podsRes.json(), replicasRes.json()])
      )
      .then(([podsData, replicasData]) => {
        setStats({
          totalPods: podsData.pods.length,
          totalDeployments: replicasData.replicas.length,
          deployments: replicasData.replicas
        });
      });
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  // Get status color for replicas
  const getReplicaStatus = (current, desired) => {
    if (current === desired) return styles.healthy;
    if (current === 0) return styles.danger;
    return styles.warning;
  };

  return (
    <div style={styles.container}>
      <h1 className="text-center m-10" style={{ color: '#8a2be2' }}>Cluster Overview</h1>
      
      <div style={styles.cardsContainer}>
        <div style={styles.card}>
          <div style={styles.cardTitle}>Total Pods</div>
          <div style={styles.cardValue}>{stats.totalPods}</div>
          <div style={{ color: '#6c757d' }}>Currently running</div>
        </div>
        
        <div style={styles.card}>
          <div style={styles.cardTitle}>Total Deployments</div>
          <div style={styles.cardValue}>{stats.totalDeployments}</div>
          <div style={{ color: '#6c757d' }}>Active deployments</div>
        </div>
      </div>

      <div style={styles.deploymentsContainer}>
        <h2 style={{ ...styles.cardTitle, textAlign: 'left', marginBottom: '20px' }}>
          Deployment Details
        </h2>
        
        {stats.deployments.map((deploy, index) => (
          <div key={index} style={styles.deploymentItem}>
            <div style={styles.deploymentName}>{deploy.name}</div>
            <div style={styles.replicaCount}>
              <div style={styles.replicaNumber}>{deploy.current}</div>
              <span style={{ marginRight: '10px' }}>/</span>
              <div style={styles.replicaNumber}>{deploy.desired}</div>
              <span style={{
                ...getReplicaStatus(deploy.current, deploy.desired),
                marginLeft: '10px',
                fontWeight: 'bold'
              }}>
                {deploy.current === deploy.desired ? 'Healthy' : 
                 deploy.current === 0 ? 'Down' : 'Partial'}
              </span>
            </div>
          </div>
        ))}
      </div>
{/* <AutoscalerControl />

<AutoscalerDashboard /> */}
    </div>
  );
}

export default Home;