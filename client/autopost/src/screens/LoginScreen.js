import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { login } from '../service/userService';
import { useAuth } from '../service/authContext';

function LoginScreen() {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState(''); // State to track error messages

    const { loginContext } = useAuth();

    const handleUsernameChange = (event) => {
        setUsername(event.target.value);
    };

    const handlePasswordChange = (event) => {
        setPassword(event.target.value);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setErrorMessage(''); // Reset error message

        try {
            const loginResponse = await login(username, password);
            console.log(loginResponse);
            // Set context  
            loginContext(loginResponse);
            navigate('/jobscheduler');
        } catch (e) {
            console.log(e);
            setErrorMessage('Incorrect username or password'); // Set error message
        }
    };

    const handleRegisterClick = () => {
        navigate('/registration');
    };

    return (
        <div className="login-page">
            <Navbar></Navbar>
            <header className="login-box">
                <h1>Login</h1>

                <form onSubmit={handleSubmit} className='login-input-container'>
                    <div>
                        <input
                            type="text"
                            value={username}
                            onChange={handleUsernameChange}
                            required
                            placeholder='Username'
                        />
                    </div>

                    <div>
                        <input
                            type="password"
                            value={password}
                            onChange={handlePasswordChange}
                            required
                            placeholder='Password'
                        />
                    </div>

                    {errorMessage && (
                        <div className="login-error-message">
                            <p>{errorMessage}</p>
                        </div>
                    )}

                    <div>
                        <button type="submit">Login</button>
                    </div>

                    <p className='login-register-anchor'>
                        Don't have an account? <a href='' onClick={handleRegisterClick}>Register</a>
                    </p>
                </form>
            </header>
        </div>
    );
}

export default LoginScreen;
