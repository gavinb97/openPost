import logo from './../logo.svg';
import './../App.css';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { register } from '../service/userService';
import { useAuth } from '../service/authContext'

function RegistrationScreen() {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isPasswordValid, setIsPasswordValid] = useState({
        length: false,
        uppercase: false,
        specialChar: false
    });
    const [isUsernameValid, setIsUsernameValid] = useState(false);
    const [isUsernameTaken, setIsUsernameTaken] = useState(false);

    const { user, loginContext } = useAuth();

    const handleUsernameChange = (event) => {
        const newUsername = event.target.value;
        setUsername(newUsername);

        // Username validation logic
        setIsUsernameValid(newUsername.length >= 5);
        setIsUsernameTaken(false); // Reset this flag when username is changed
    };

    const handleEmailChange = (event) => {
        setEmail(event.target.value);
    };

    const handlePasswordChange = (event) => {
        const newPassword = event.target.value;
        setPassword(newPassword);

        // Password validation logic
        setIsPasswordValid({
            length: newPassword.length >= 8,
            uppercase: /[A-Z]/.test(newPassword),
            specialChar: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword)
        });
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        try {
            const registerResponse = await register(username, password, email);
            console.log('register response: ' + registerResponse);
            // Set context
            loginContext(registerResponse);
            navigate('/jobscheduler');
        } catch (e) {
            console.log('failed to register: ', e);
            setIsUsernameTaken(true);
            
        }
    };

    const handleLoginClick = () => {
        navigate('/login');
    };

    // Check if all validations pass
    const allValidationsPassed = isUsernameValid && Object.values(isPasswordValid).every(Boolean);

    return (
        <div className="registration-page">
            <Navbar />
            <div className='registration-box'>
                <header>
                    <h1>Create Your Account</h1>

                    <form onSubmit={handleSubmit} className='registration-input-container'>
                        <div>
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
                            <input
                                type="email"
                                value={email}
                                onChange={handleEmailChange}
                                required
                                placeholder='Email'
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

                        {username && (
                            <div className='username-validations'>
                                <p className={isUsernameValid ? 'valid' : 'invalid'}>
                                    {isUsernameValid ? '✓' : '✗'} Username is at least 5 characters
                                </p>
                                {isUsernameTaken && (
                                    <p className='invalid'>
                                        ✗ Username is already taken
                                    </p>
                                )}
                            </div>
                        )}

                        {username && email && (
                            <div className='password-validations'>
                                <p className={isPasswordValid.length ? 'valid' : 'invalid'}>
                                    {isPasswordValid.length ? '✓' : '✗'} Password is 8 or more characters
                                </p>
                                <p className={isPasswordValid.uppercase ? 'valid' : 'invalid'}>
                                    {isPasswordValid.uppercase ? '✓' : '✗'} Password has at least one uppercase letter
                                </p>
                                <p className={isPasswordValid.specialChar ? 'valid' : 'invalid'}>
                                    {isPasswordValid.specialChar ? '✓' : '✗'} Password has at least one special character
                                </p>
                            </div>
                        )}

                        <div className='registerbutton'>
                            <button type="submit" disabled={!allValidationsPassed}>Sign Up</button>
                        </div>
                        <p className='login-register-anchor'>Already have an account? <a href='' onClick={handleLoginClick}>Login</a></p>
                    </form>
                </header>
            </div>
        </div>
    );
}

export default RegistrationScreen;
