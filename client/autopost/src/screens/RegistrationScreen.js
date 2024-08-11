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

    const handleLoginClick = () => {
        navigate('/login')
    }

    return (
        <div className="registration-page">
            <Navbar></Navbar>
            <div className='registration-box'>
                 <header>
                <h1>Create Your Account</h1>

                <form onSubmit={handleSubmit} className='registration-input-container'>
                    <div >
                        {/* <label>Username: </label> */}
                        <input
                            type="text"
                            value={username}
                            onChange={handleUsernameChange}
                            minLength={5}
                            required
                            placeholder='Username'
                        />
                    </div>

                    <div>
                        {/* <label>Email: </label> */}
                        <input
                            type="email"
                            value={email}
                            onChange={handleEmailChange}
                            required
                            placeholder='Email'
                        />
                    </div>

                    <div>
                        {/* <label>Password: </label> */}
                        <input
                            type="password"
                            value={password}
                            onChange={handlePasswordChange}
                            minLength={6}
                            required
                            placeholder='Password'
                        />
                    </div>

                    <div>
                        <button type="submit">Sign Up</button>
                    </div>
                    <p className='login-register-anchor'>Already have an account? <a href='' onClick={handleLoginClick}>Login</a></p>
                </form>
            </header>
            </div>
           
        </div>
    );
}


export default RegistrationScreen;