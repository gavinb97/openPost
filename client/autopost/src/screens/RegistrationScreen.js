import logo from './../logo.svg';
import './../App.css';
import React, { useState } from 'react';
import {uploadFile} from '../service/redditService'

function RegistrationScreen() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleUsernameChange = (event) => {
        setUsername(event.target.value);
    };

    const handleEmailChange = (event) => {
        setEmail(event.target.value);
    };

    const handlePasswordChange = (event) => {
        setPassword(event.target.value);
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        // Your registration logic goes here
    };

    return (
        <div className="App">
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