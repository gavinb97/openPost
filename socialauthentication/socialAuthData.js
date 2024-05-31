const pool = require('../jobs/db');
const bcrypt = require('bcrypt');

const registerUserDB = async (user) => {
    const { username, email, password } = user;

    // Check for empty or null values
    if (!username || !email || !password) {
        throw new Error('Username, email, and password must not be empty or null.');
    }

    // Hash the password before storing it
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        // Connect to the pool
        const client = await pool.connect();

        // Check if the username already exists
        const userCheckQuery = 'SELECT * FROM users WHERE username = $1';
        const res = await client.query(userCheckQuery, [username]);
        if (res.rows.length > 0) {
            throw new Error('Username already exists.');
        }

        // Insert the new user into the users table
        const insertQuery = `
            INSERT INTO users (username, email, password)
            VALUES ($1, $2, $3)
            RETURNING userid;
        `;
        const result = await client.query(insertQuery, [username, email, hashedPassword]);
        console.log('User registered successfully:', result.rows[0]);

        // Release the client back to the pool
        client.release();

        return result;
    } catch (error) {
        throw new Error(`Failed to register user: ${error.message}`);
    }
};


const authenticateUserDB = async (username, password) => {
    if (!username || !password) {
        throw new Error('Both username and password are required.');
    }
    console.log('innit');
    try {
        // Connect to the pool
        const client = await pool.connect();

        // Query the user by username
        const query = 'SELECT * FROM users WHERE username = $1';
        const res = await client.query(query, [username]);

        // Release the client back to the pool
        client.release();
        
        if (res.rows.length === 0) {
            throw new Error('Username not found.');
        }

        const user = res.rows[0];

        // Check if the password is correct
        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) {
            throw new Error('Password is incorrect.');
        }
        
        // If username and password are correct, return user object
        return user;  // return an object containing the user
    } catch (error) {
        throw new Error(`Authentication failed: ${error.message}`);
    }
};


module.exports = { 
    registerUserDB, authenticateUserDB 
}