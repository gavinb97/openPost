import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { login } from '../service/userService';
import { loginContext } from '../service/authContext'

function LoginScreen() {
    const navigate = useNavigate()
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleUsernameChange = (event) => {
        setUsername(event.target.value);
    };

    const handlePasswordChange = (event) => {
        setPassword(event.target.value);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        try {
            await login(username, password)
            navigate('/landing')
        } catch (e) {
            console.log(e)
        }
        
    };

    return (
        <div className="App">
            <Navbar></Navbar>
            <header className="App-header">
                <p>Login</p>

                <form onSubmit={handleSubmit}>
                    <div>
                        <label>Username: </label>
                        <input
                            type="text"
                            value={username}
                            onChange={handleUsernameChange}
                            required
                        />
                    </div>

                    <div>
                        <label>Password: </label>
                        <input
                            type="password"
                            value={password}
                            onChange={handlePasswordChange}
                            required
                        />
                    </div>

                    <div>
                        <button type="submit">Login</button>
                    </div>
                </form>
            </header>
        </div>
    );
}

export default LoginScreen;
