import logo from './../logo.svg';
import './../App.css';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { register } from '../service/userService';
import { useAuth } from '../service/authContext'

function RegistrationScreen() {
    const navigate = useNavigate()
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const { user, loginContext } = useAuth()

    const handleUsernameChange = (event) => {
        setUsername(event.target.value);
    };

    const handleEmailChange = (event) => {
        setEmail(event.target.value);
    };

    const handlePasswordChange = (event) => {
        setPassword(event.target.value);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        try {
            const registerResponse = await register(username, password, email)
            console.log('register response: ' + registerResponse)
            console.log(registerResponse)
            // set context
            loginContext(registerResponse)
            navigate('/jobscheduler')
        } catch (e) {
            console.log('failed to login')
        }
        
    };

    return (
        <div className="App">
            <Navbar></Navbar>
            <header className="App-header">
                <p>Registration</p>

                <form onSubmit={handleSubmit}>
                    <div>
                        <label>Username: </label>
                        <input
                            type="text"
                            value={username}
                            onChange={handleUsernameChange}
                            minLength={5}
                            required
                        />
                    </div>

                    <div>
                        <label>Email: </label>
                        <input
                            type="email"
                            value={email}
                            onChange={handleEmailChange}
                            required
                        />
                    </div>

                    <div>
                        <label>Password: </label>
                        <input
                            type="password"
                            value={password}
                            onChange={handlePasswordChange}
                            minLength={6}
                            required
                        />
                    </div>

                    <div>
                        <button type="submit">Register</button>
                    </div>
                </form>
            </header>
        </div>
    );
}


export default RegistrationScreen;