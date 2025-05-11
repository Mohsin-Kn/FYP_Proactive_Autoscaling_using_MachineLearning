import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Sidebar() {
    const location = useLocation();
    const navigate = useNavigate();
    const { logout } = useAuth();
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    
    const handleLogoutClick = () => {
        setShowLogoutModal(true);
    };

    const handleConfirmLogout = () => {
        logout();
        setShowLogoutModal(false);
        navigate('/login');
    };

    const handleCancelLogout = () => {
        setShowLogoutModal(false);
    };

    const menuItems = [
        { path: "/", label: "Home" },
        //  { path: "/nodes", label: "Nodes" },
        { path: "/pods", label: "Pods" },
        { path: "/history", label: "History" },
        // { path: "/settings", label: "Settings" },
        { label: "Logout", onClick: handleLogoutClick }
    ];

    return (
        <>
            <div className="bg-white p-3 border-end rounded" style={{ width: '200px', marginTop: '1rem', marginBottom: '1rem', marginLeft: '1rem', height: 'calc(100vh - 2.5rem)' }}>
                <ul className="list-unstyled mt-8">
                    {menuItems.map((item) => (
                        <li key={item.label} className="mb-4 text-center">
                            {item.path ? (
                                <Link 
                                    to={item.path} 
                                    className={`text-dark text-decoration-none p-2 d-block rounded menu-item fs-5 
                                        ${location.pathname === item.path ? 'active-link' : ''}`}
                                >
                                    <span>{item.label}</span>
                                </Link>
                            ) : (
                                <button 
                                    onClick={item.onClick}
                                    className="btn btn-link text-dark text-decoration-none p-2 d-block w-100 rounded menu-item fs-5"
                                >
                                    <span>{item.label}</span>
                                </button>
                            )}
                        </li>
                    ))}
                </ul>
            </div>

            {/* Logout Confirmation Modal */}
            {showLogoutModal && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title text-purple">Confirm Logout</h5>
                                <button type="button" className="btn-close" onClick={handleCancelLogout}></button>
                            </div>
                            <div className="modal-body">
                                <p>Are you sure you want to logout?</p>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-outline-purple" onClick={handleCancelLogout}>
                                    No
                                </button>
                                <button type="button" className="btn btn-purple" onClick={handleConfirmLogout}>
                                    Yes
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default Sidebar;
