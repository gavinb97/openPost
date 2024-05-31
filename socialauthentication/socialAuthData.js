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

        try {
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
            const userId = result.rows[0].userid;

            console.log('User registered successfully:', result.rows[0]);

            // Check if there's an entry in the user_creds table for the username and userid
            const credsCheckQuery = 'SELECT * FROM user_creds WHERE username = $1 AND userid = $2';
            const credsRes = await client.query(credsCheckQuery, [username, userId]);
            if (credsRes.rows.length === 0) {
                // Insert a new entry into the user_creds table
                const insertCredsQuery = `
                    INSERT INTO user_creds (userid, username, twitter_access_token, twitter_refresh_token, twitter_code_verifier, reddit_access_token, reddit_refresh_token, tiktok_access_token, tiktok_refresh_token, youtube_access_token, youtube_refresh_token)
                    VALUES ($1, $2, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL)
                `;
                await client.query(insertCredsQuery, [userId, username]);
                console.log('User credentials initialized successfully.');
            }

            // Return the user registration result
            return result;
        } finally {
            // Release the client back to the pool
            client.release();
        }
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

const getUserCreds = async (username, userid) => {
    // Check for empty or null values
    if (!username || !userid) {
        throw new Error('Both username and userid are required.');
    }

    try {
        // Connect to the pool
        const client = await pool.connect();

        // Query the user credentials by username and userid
        const query = 'SELECT * FROM user_creds WHERE username = $1 AND userid = $2';
        const res = await client.query(query, [username, userid]);

        // Release the client back to the pool
        client.release();

        // Check if the user credentials exist
        if (res.rows.length === 0) {
            throw new Error('User credentials not found.');
        }

        // Return the user credentials
        return res.rows[0];
    } catch (error) {
        throw new Error(`Failed to retrieve user credentials: ${error.message}`);
    }
};

const updateTwitterCodeVerifier = async (username, codeVerifier) => {
    if (!username || !codeVerifier) {
        throw new Error('Both username and codeVerifier are required.');
    }

    try {
        // Connect to the pool
        const client = await pool.connect();

        try {
            // Check if the username exists in the user_creds table
            const userCheckQuery = 'SELECT * FROM user_creds WHERE username = $1';
            const res = await client.query(userCheckQuery, [username]);
            if (res.rows.length === 0) {
                throw new Error('Username not found in user_creds table.');
            }

            // Update the user_creds table with the codeVerifier
            const updateQuery = `
                UPDATE user_creds
                SET twitter_code_verifier = $1
                WHERE username = $2;
            `;
            await client.query(updateQuery, [codeVerifier, username]);
            console.log('Twitter code verifier updated successfully.');
        } finally {
            // Release the client back to the pool
            client.release();
        }
    } catch (error) {
        throw new Error(`Failed to update Twitter code verifier: ${error.message}`);
    }
};



module.exports = { 
    registerUserDB, authenticateUserDB, getUserCreds
}