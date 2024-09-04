require("dotenv").config();
const fs = require('fs')
const path = require('path');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'; 
const { findUserCredentials } = require('../utils')
const { registerUserDB, authenticateUserDB, getCredsByUser, getUserEmailByUsername, updateProStatus, deactivateProStatus } = require('./socialAuthData')
const stripe = require('stripe')(process.env.STRIPE_KEY);

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

const fetchUserEmail = async (username) => {
    try {
        // Call the getUserEmailByUsername function and await the result
        const email = await getUserEmailByUsername(username);

        // If an email was found, return it
        if (email) {
            console.log(`Email for user ${username}: ${email}`);
            return email;
        } else {
            throw new Error(`No email found for username: ${username}`);
        }
    } catch (error) {
        console.error('Error fetching user email:', error.message);
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
        await createMediaFolders(username, `${process.env.PHOTODATA_PATH}`)
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

const fulfillCheckout = async (sessionId) => {
    console.log(sessionId)
    console.log('in fulfil checkout')
    console.log(process.env.STRIPE_KEY)
 
    console.log('Fulfilling Checkout Session ' + sessionId);
  
    // TODO: Make this function safe to run multiple times,
    // even concurrently, with the same session ID
  
    // TODO: Make sure fulfillment hasn't already been
    // peformed for this Checkout Session
  
    // Retrieve the Checkout Session from the API with line_items expanded
    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items'],
    });

  
    // Check the Checkout Session's payment_status property
    // to determine if fulfillment should be peformed
    if (checkoutSession.payment_status !== 'unpaid') {
      // TODO: Perform fulfillment of the line items
        console.log(checkoutSession)
      // TODO: Record/save fulfillment status for this
      // Checkout Session
        console.log('updating pro status...')
        const customerId = checkoutSession.customer

        console.log(checkoutSession.customer_email)
        await updateProStatus(checkoutSession.customer_email, customerId)
    }
}

const cancelMembership = async (sessionId) => {
    const session = await stripe.subscriptions.retrieve(sessionId, {
        expand: ['customer'],
      });
      
      const email = session.customer.email;
      const customerId = session.customer.id
      console.log('Subscription schedule aborted for email:', email);
    //   console.log(session)
      const customer = await stripe.customers.retrieve(customerId);
      console.log(customer)
      console.log('customer ^^')
      await deactivateProStatus(email)
}

module.exports = {
    getUserByUsername,
    registerUser,
    authenticateUser,
    authenticateToken,
    getUserCreds,
    fulfillCheckout,
    fetchUserEmail,
    cancelMembership
}