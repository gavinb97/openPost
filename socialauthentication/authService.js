const fs = require('fs')
const path = require('path');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'; 
const { findUserCredentials } = require('../utils')
const { registerUserDB, authenticateUserDB, getCredsByUser } = require('./socialAuthData')

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
        await createMediaFolders(username, 'C:\\Users\\Gavin\\Desktop\\BuildABlog\\openPost\\apiresources\\uploads\\')
    } catch (error) {
        throw new Error(`Failed to register user: ${error.message}`);
    }
};

const createMediaFolders = async (username, basePath) => {
    const userFolderPath = path.join(basePath, username);
    const photosFolderPath = path.join(userFolderPath, 'photos');
    const videosFolderPath = path.join(userFolderPath, 'videos');
    const metadataFolderPath = path.join(userFolderPath, 'photoMetaData');

    console.log('Attempting to create folders');

    try {
        // Create the user's folder and any intermediate directories
        await fs.promises.mkdir(userFolderPath, { recursive: true });
        console.log(`Folder for user ${username} created or already exists.`);

        // Create photos, videos, and metadata folders if they don't exist
        await fs.promises.mkdir(photosFolderPath, { recursive: true });
        console.log(`Photos folder for user ${username} created or already exists.`);

        await fs.promises.mkdir(videosFolderPath, { recursive: true });
        console.log(`Videos folder for user ${username} created or already exists.`);

        await fs.promises.mkdir(metadataFolderPath, { recursive: true });
        console.log(`Metadata folder for user ${username} created or already exists.`);

    } catch (error) {
        console.error('Error creating media folders:', error);
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
    const userCreds = await getCredsByUser(username)
    return userCreds
}

module.exports = {
    getUserByUsername,
    registerUser,
    authenticateUser,
    authenticateToken,
    getUserCreds
}