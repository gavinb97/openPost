const fs = require('fs')
const path = require('path');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'; 
const { findUserCredentials } = require('../utils')
const { registerUserDB, authenticateUserDB } = require('./socialAuthData')

const getUserByUsername = async (filename, username) => {
    try {
        // Read the JSON data from the file
        const jsonData = await fs.promises.readFile(filename, 'utf8');
        const dataArray = JSON.parse(jsonData);

        // Find the object with the specified username
        const userObject = dataArray.find(obj => obj.user === username);

        return userObject;
    } catch (error) {
        console.error('Error reading file or parsing JSON:', error);
        throw error;
    }
};


const registerUser = async (user) => {
    const { username, email, password } = user;

    // Check for empty or null values
    if (!username || !email || !password) {
        throw new Error('Username, email, and password must not be empty or null.');
    }

    try {
        const userid = await registerUserDB(user)
        
        console.log(`User registered successfully: ${userid}`);
    } catch (error) {
        throw new Error(`Failed to register user: ${error.message}`);
    }
};

const authenticateUser = async (username, password) => {
    if (!username || !password) {
        throw new Error('Both username and password are required.');
    }

    console.log(username)
    console.log(password)
    
    try {
       const user = await authenticateUserDB(username, password)
       console.log(user.username)
       console.log('username above')
       return { username: user.username };  // return an object containing the username
    } catch (error) {
        throw new Error(`Authentication failed: ${error.message}`);
    }
};

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];  // "Bearer TOKEN_HERE"
  
    if (token == null) return res.sendStatus(401);
  
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) return res.sendStatus(403);  // Forbidden if token is invalid
  
      req.user = user;
      next();
    });
  };

const getUserCreds = async (username) => {
    const userCreds = await findUserCredentials(username)
    return userCreds
}

module.exports = {
    getUserByUsername,
    registerUser,
    authenticateUser,
    authenticateToken,
    getUserCreds
}