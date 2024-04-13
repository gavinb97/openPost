const fs = require('fs')
const path = require('path');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'; 


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

    const filePath = path.join(__dirname, 'userData', 'userAuth.json');

    try {
        // Ensure the authData directory exists
        if (!fs.existsSync(path.dirname(filePath))) {
            fs.mkdirSync(path.dirname(filePath), { recursive: true });
        }

        let users = [];
        if (fs.existsSync(filePath)) {
            // Read the current file if it exists
            const data = fs.readFileSync(filePath, 'utf8');
            users = JSON.parse(data);
        }

        // Check if the username already exists
        if (users.some(u => u.username === username)) {
            throw new Error('Username already exists.');
        }

        // Add the new user to the array
        users.push(user);

        // Write the updated array back to the file
        fs.writeFileSync(filePath, JSON.stringify(users, null, 2), 'utf8');
        console.log('User registered successfully.');
    } catch (error) {
        throw new Error(`Failed to register user: ${error.message}`);
    }
};

const authenticateUser = async (username, password) => {
    if (!username || !password) {
        throw new Error('Both username and password are required.');
    }

    const filePath = path.join(__dirname, 'userData', 'userAuth.json');

    try {
        // Check if the file exists
        if (!fs.existsSync(filePath)) {
            throw new Error('Authentication data is missing.');
        }

        // Read the file
        const data = fs.readFileSync(filePath, 'utf8');
        const users = JSON.parse(data);

        // Find the user by username
        const user = users.find(u => u.username === username);
        if (!user) {
            throw new Error('Username not found.');
        }

        // Check if the password is correct
        if (user.password !== password) {
            throw new Error('Password is incorrect.');
        }

        // If username and password are correct, return user object
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

module.exports = {
    getUserByUsername,
    registerUser,
    authenticateUser,
    authenticateToken
}