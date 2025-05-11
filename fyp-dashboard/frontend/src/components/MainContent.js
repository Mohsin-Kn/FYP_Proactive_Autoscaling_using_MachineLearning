import React from 'react';
import { useLocation } from 'react-router-dom';
import TrafficHistory from './TrafficHistory';
import AutoscalingComparison from './AutoscalingComparison';
import Pods from './Pods';
import Home from './Home';

function MainContent() {
  const location = useLocation();
  
  // Helper function to get the title based on current path
  const getTitle = (path) => {
    switch(path) {
      case '/':
        return 'Home';
      case '/pods':
        return 'Pods';
      case '/history':
        return 'History';
      case '/logout':
        return 'Logout';
      default:
        return 'Dashboard';
    }
  };

  return (
    <div className="mx-3 my-1 flex-grow-1 d-flex flex-column" style={{ maxHeight: '85vh' }}>
      <div className="bg-white rounded p-4 shadow-sm flex-grow-1">
        <h3 className="mb-4" style={{ color: '#8a2be2' }}>{getTitle(location.pathname)}</h3>
        <div className="h-100">
          {location.pathname === '/' ? (
            <><Home /></>
          ) : null}
          {location.pathname === '/pods' ? (
            <Pods />
          ) : null}
          {location.pathname === '/history' ? (
            <TrafficHistory />
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default MainContent;
