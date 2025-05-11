import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleSubmit = (e) => {
        e.preventDefault();
        const isSuccess = login(username, password);
        
        if (isSuccess) {
            navigate('/');
        } else {
            setError('Invalid credentials');
        }
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    return (
        <div className="container mt-5">
            <div className="row justify-content-center">
                <div className="col-md-6">
                    <form onSubmit={handleSubmit} className="p-4 rounded shadow">
                        {error && <div className="alert alert-danger">{error}</div>}
                        <div className="mb-3">
                            <label className="form-label text-purple">Username</label>
                            <input
                                type="text"
                                className="form-control border-purple"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />
                        </div>
                        <div className="mb-3">
                            <label className="form-label text-purple">Password</label>
                            <div className="input-group">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    className="form-control border-purple"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <button
                                    type="button"
                                    className="btn btn-outline-purple"
                                    onClick={togglePasswordVisibility}
                                    style={{ cursor: 'pointer' }}
                                >
                                    {showPassword ? '⊘' : '⊙'}
                                </button>
                            </div>
                        </div>
                        <button type="submit" className="btn btn-purple w-100">Login</button>
                    </form>
                </div>
            </div>
        </div>
    );
}

// Add these CSS styles to your global CSS file (e.g., App.css or index.css)
const styles = `
    .btn-purple {
        background-color: #6f42c1;
        color: white;
    }

    .btn-purple:hover {
        background-color: #5a32a3;
        color: white;
    }

    .btn-outline-purple {
        color: #6f42c1;
        border-color: #6f42c1;
    }

    .btn-outline-purple:hover {
        background-color: #6f42c1;
        color: white;
    }

    .text-purple {
        color: #6f42c1;
    }

    .border-purple {
        border-color: #6f42c1 !important;
        background-color: #ffffff !important;
    }

    .border-purple:focus {
        border-color: #6f42c1;
        box-shadow: 0 0 0 0.2rem rgba(111, 66, 193, 0.25);
        background-color: #ffffff !important;
    }
`;

// Add this style tag to your component
const styleSheet = document.createElement("style");
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);

export default Login; 