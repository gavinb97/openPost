const pool = require('../jobs/db');
const bcrypt = require('bcrypt');
// const { queryCreatorInfo } = require('./tiktokService')

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
                INSERT INTO users (username, email, password, pro)
                VALUES ($1, $2, $3, false)
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

const getUpdatedDetails = async (username) => {
  if (!username) {
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
    console.log(user);
    console.log('user ^^^');
    return user; 
  } catch (error) {
    throw new Error(`Authentication failed: ${error.message}`);
  }
};

const getTwitterCodeVerifierByUsername = async (username) => {
  if (!username) {
    throw new Error('Username is required.');
  }

  try {
    // Connect to the pool
    const client = await pool.connect();

    try {
      // Query to get the twitter_code_verifier by username
      const query = 'SELECT twitter_code_verifier FROM user_creds WHERE username = $1';
      const res = await client.query(query, [username]);

      if (res.rows.length === 0) {
        throw new Error('Username not found in user_creds table.');
      }

      const twitterCodeVerifier = res.rows[0].twitter_code_verifier;
      return twitterCodeVerifier;
    } finally {
      // Release the client back to the pool
      client.release();
    }
  } catch (error) {
    throw new Error(`Failed to get Twitter code verifier: ${error.message}`);
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

const updateTwitterTokens = async (username, accessToken, refreshToken, oauthVerifier, handle) => {
  if (!username || !accessToken || !refreshToken) {
    throw new Error('Username, access token, and refresh token are required.');
  }

  try {
    // Connect to the pool
    const client = await pool.connect();

    try {
      // Retrieve the userid from the users table
      const userQuery = 'SELECT userid FROM users WHERE username = $1';
      const userResult = await client.query(userQuery, [username]);

      if (userResult.rowCount === 0) {
        throw new Error('Username not found in users table.');
      }

      const userid = userResult.rows[0].userid;

      let query;
      let values;

      // Check if a record already exists for the given username and handle
      const checkQuery = 'SELECT * FROM user_creds WHERE username = $1 AND handle = $2';
      const checkResult = await client.query(checkQuery, [username, handle]);

      if (oauthVerifier) {
        if (checkResult.rowCount === 0) {
          console.log('run insert');
          query = `
                    INSERT INTO user_creds (userid, username, twitter_access_token, twitter_refresh_token, twitter_code_verifier, handle)
                    VALUES ($1, $2, $3, $4, $5, $6)
                    `;
          values = [userid, username, accessToken, refreshToken, oauthVerifier, handle];
        } else {
          console.log('run update');
          // Update existing record if no oauthVerifier is provided
          query = `
                    UPDATE user_creds
                    SET twitter_access_token = $1, twitter_refresh_token = $2
                    WHERE username = $3 AND handle = $4
                `;
          values = [accessToken, refreshToken, username, handle];
        }
                
      } else {
        if (checkResult.rowCount === 0) {
          throw new Error('No existing record found for this username and handle.');
        }
        console.log('run update n oauth');
        // Update existing record if no oauthVerifier is provided
        query = `
                    UPDATE user_creds
                    SET twitter_access_token = $1, twitter_refresh_token = $2
                    WHERE username = $3 AND handle = $4
                `;
        values = [accessToken, refreshToken, username, handle];
      }

      const res = await client.query(query, values);
            
      if (res.rowCount === 0) {
        throw new Error('Failed to update or insert Twitter tokens.');
      }

      console.log('Twitter tokens processed successfully for username:', username);
    } finally {
      // Release the client back to the pool
      client.release();
    }
  } catch (error) {
    throw new Error(`Failed to process Twitter tokens: ${error.message}`);
  }
};

const updateRedditTokens = async (username, accessToken, refreshToken, handle) => {
  if (!username || !accessToken || !refreshToken || !handle) {
    throw new Error('Username, access token, refresh token, and handle are required.');
  }

  try {
    // Connect to the pool
    const client = await pool.connect();

    try {
            
      // Check if a record exists for the given username and handle
      const checkQuery = 'SELECT * FROM user_creds WHERE username = $1 AND handle = $2';
      const checkResult = await client.query(checkQuery, [username, handle]);

      // Retrieve the userid from the users table
      const userQuery = 'SELECT userid FROM users WHERE username = $1';
      const userResult = await client.query(userQuery, [username]);

      if (userResult.rowCount === 0) {
        throw new Error('Username not found in users table.');
      }

      const userid = userResult.rows[0].userid;

      let query;
      let values;

      if (checkResult.rowCount > 0) {
        // If a record exists, update it with the new tokens
        query = `
                    UPDATE user_creds
                    SET reddit_access_token = $1, reddit_refresh_token = $2
                    WHERE username = $3 AND handle = $4
                `;
        values = [accessToken, refreshToken, username, handle];
      } else {
        // If no record exists, insert a new one
        query = `
                    INSERT INTO user_creds (username, reddit_access_token, reddit_refresh_token, handle, userid)
                    VALUES ($1, $2, $3, $4, $5)
                `;
        values = [username, accessToken, refreshToken, handle, userid];
      }

      const res = await client.query(query, values);
            
      if (res.rowCount === 0) {
        throw new Error('Failed to update or insert Reddit tokens.');
      }

      console.log('Reddit tokens processed successfully for username:', username);
    } finally {
      // Release the client back to the pool
      client.release();
    }
  } catch (error) {
    throw new Error(`Failed to process Reddit tokens: ${error.message}`);
  }
};

const updateTikTokTokens = async (username, accessToken, refreshToken, handle) => {
  if (!username || !accessToken || !refreshToken || !handle) {
    throw new Error('Username, access token, refresh token, and handle are required.');
  }

  try {
    // Connect to the pool
    const client = await pool.connect();
      
    try {
      // Check if a record exists for the given username and handle
      const checkQuery = 'SELECT * FROM user_creds WHERE username = $1 AND handle = $2';
      const checkResult = await client.query(checkQuery, [username, handle]);

      let query;
      let values;

      // Retrieve the userid from the users table
      const userQuery = 'SELECT userid FROM users WHERE username = $1';
      const userResult = await client.query(userQuery, [username]);

      if (userResult.rowCount === 0) {
        throw new Error('Username not found in users table.');
      }

      const userid = userResult.rows[0].userid;

      if (checkResult.rowCount > 0) {
        // If a record exists, update it with the new tokens
        query = `
                    UPDATE user_creds
                    SET tiktok_access_token = $1, tiktok_refresh_token = $2
                    WHERE username = $3 AND handle = $4
                `;
        values = [accessToken, refreshToken, username, handle];
      } else {
        // If no record exists, insert a new one
        query = `
                    INSERT INTO user_creds (username, tiktok_access_token, tiktok_refresh_token, handle, userid)
                    VALUES ($1, $2, $3, $4, $5)
                `;
        values = [username, accessToken, refreshToken, handle, userid];
      }

      const res = await client.query(query, values);
            
      if (res.rowCount === 0) {
        throw new Error('Failed to update or insert TikTok tokens.');
      }

      console.log('TikTok tokens processed successfully for username:', username);
    } finally {
      // Release the client back to the pool
      client.release();
    }
  } catch (error) {
    throw new Error(`Failed to process TikTok tokens: ${error.message}`);
  }
};

const updateYouTubeTokens = async (username, accessToken, refreshToken, handle) => {
  if (!username || !accessToken || !refreshToken || !handle) {
    throw new Error('Username, access token, refresh token, and handle are required.');
  }

  try {
    // Connect to the pool
    const client = await pool.connect();

    try {
      // Check if a record exists for the given username and handle
      const checkQuery = 'SELECT * FROM user_creds WHERE username = $1 AND handle = $2';
      const checkResult = await client.query(checkQuery, [username, handle]);

      let query;
      let values;

      // Retrieve the userid from the users table
      const userQuery = 'SELECT userid FROM users WHERE username = $1';
      const userResult = await client.query(userQuery, [username]);

      if (userResult.rowCount === 0) {
        throw new Error('Username not found in users table.');
      }

      const userid = userResult.rows[0].userid;

      if (checkResult.rowCount > 0) {
        // If a record exists, update it with the new tokens
        query = `
                    UPDATE user_creds
                    SET youtube_access_token = $1, youtube_refresh_token = $2
                    WHERE username = $3 AND handle = $4
                `;
        values = [accessToken, refreshToken, username, handle];
      } else {
        // If no record exists, insert a new one
        query = `
                    INSERT INTO user_creds (username, youtube_access_token, youtube_refresh_token, handle, userid)
                    VALUES ($1, $2, $3, $4, $5)
                `;
        values = [username, accessToken, refreshToken, handle, userid];
      }

      const res = await client.query(query, values);

      if (res.rowCount === 0) {
        throw new Error('Failed to update or insert YouTube tokens.');
      }

      console.log('YouTube tokens processed successfully for username:', username);
    } finally {
      // Release the client back to the pool
      client.release();
    }
  } catch (error) {
    throw new Error(`Failed to process YouTube tokens: ${error.message}`);
  }
};


const revokeTwitterTokens = async (username, handle) => {
  if (!username) {
    throw new Error('Username is required.');
  }

  try {
    // Connect to the pool
    const client = await pool.connect();

    try {
      // Update query to set the twitter access and refresh tokens to null
      const updateQuery = `
                delete from user_creds where username = $1 and handle = $2
            `;
      const res = await client.query(updateQuery, [username, handle]);

      if (res.rowCount === 0) {
        throw new Error('Username not found in user_creds table.');
      }

      console.log('Twitter tokens revoked successfully for username:', username);
    } finally {
      // Release the client back to the pool
      client.release();
    }
  } catch (error) {
    throw new Error(`Failed to revoke Twitter tokens: ${error.message}`);
  }
};

const revokeRedditTokens = async (username, access_token, handle) => {
  if (!username) {
    throw new Error('Username is required.');
  }

  try {
    // Connect to the pool
    const client = await pool.connect();
        
    try {
      // Update query to set the Reddit access and refresh tokens to null
      const updateQuery = `
                delete from user_creds where username = $1 and handle = $2
            `;
      const res = await client.query(updateQuery, [username, handle]);

      if (res.rowCount === 0) {
        throw new Error('Username not found in user_creds table.');
      }

      console.log('Reddit tokens revoked successfully for username:', username);
    } finally {
      // Release the client back to the pool
      client.release();
    }
  } catch (error) {
    throw new Error(`Failed to revoke Reddit tokens: ${error.message}`);
  }
};

const revokeYouTubeTokens = async (username, handle) => {
  if (!username) {
    throw new Error('Username is required.');
  }

  try {
    // Connect to the pool
    const client = await pool.connect();

    try {
      // Update query to set the YouTube access and refresh tokens to null
      const updateQuery = `
                delete from user_creds where username = $1 and handle = $2
            `;
      const res = await client.query(updateQuery, [username, handle]);

      if (res.rowCount === 0) {
        throw new Error('Username not found in user_creds table.');
      }

      console.log('YouTube tokens revoked successfully for username:', username);
    } finally {
      // Release the client back to the pool
      client.release();
    }
  } catch (error) {
    throw new Error(`Failed to revoke YouTube tokens: ${error.message}`);
  }
};

const revokeTikTokTokens = async (username, handle) => {
  if (!username) {
    throw new Error('Username is required.');
  }

  try {
    // Connect to the pool
    const client = await pool.connect();
    console.log(username);
    console.log(handle);
    try {
      // Update query to set the TikTok access and refresh tokens to null
      const updateQuery = `
                delete from user_creds where username = $1 and handle = $2
            `;
      const res = await client.query(updateQuery, [username, handle]);

      if (res.rowCount === 0) {
        throw new Error('Username not found in user_creds table.');
      }

      console.log('TikTok tokens revoked successfully for username:', username);
    } finally {
      // Release the client back to the pool
      client.release();
    }
  } catch (error) {
    throw new Error(`Failed to revoke TikTok tokens: ${error.message}`);
  }
};

// const getCredsByUser = async (username) => {
//     if (!username) {
//         throw new Error('Username is required.');
//     }

//     try {
//         // Connect to the pool
//         const client = await pool.connect();

//         try {
//             // Query to get the credentials by username
//             const query = `
//                 SELECT
//                     twitter_access_token,
//                     twitter_refresh_token,
//                     reddit_access_token,
//                     reddit_refresh_token,
//                     tiktok_access_token,
//                     tiktok_refresh_token,
//                     youtube_access_token,
//                     youtube_refresh_token
//                 FROM user_creds
//                 WHERE username = $1
//             `;
//             const res = await client.query(query, [username]);

//             if (res.rows.length === 0) {
//                 console.log('Username not found in user_creds tablfe.');
//                 return
//             }

//             const userCreds = res.rows[0];

//             // Construct the user credentials object
//             const userObject = {
//                 user: username,
//                 twitterTokens: {
//                     access_token: userCreds.twitter_access_token,
//                     refresh_token: userCreds.twitter_refresh_token
//                 },
//                 redditTokens: {
//                     access_token: userCreds.reddit_access_token,
//                     refresh_token: userCreds.reddit_refresh_token
//                 },
//                 tiktokTokens: {
//                     access_token: userCreds.tiktok_access_token,
//                     refresh_token: userCreds.tiktok_refresh_token
//                 },
//                 youtubeTokens: {
//                     access_token: userCreds.youtube_access_token,
//                     refresh_token: userCreds.youtube_refresh_token
//                 }
//             };

//             return userObject;
//         } finally {
//             // Release the client back to the pool
//             client.release();
//         }
//     } catch (error) {
//         console.error('Error getting user credentials from user_creds table:', error);
//         throw error;
//     }
// };

const getCredsByUser = async (username) => {
  if (!username) {
    throw new Error('Username is required.');
  }

  try {
    // Connect to the pool
    const client = await pool.connect();

    try {
      // Query to get the credentials by username
      const query = `
                SELECT
                    twitter_access_token,
                    twitter_refresh_token,
                    reddit_access_token,
                    reddit_refresh_token,
                    tiktok_access_token,
                    tiktok_refresh_token,
                    youtube_access_token,
                    youtube_refresh_token,
                    handle
                FROM user_creds
                WHERE username = $1
            `;
      const res = await client.query(query, [username]);

      if (res.rows.length === 0) {
        console.log('Username not found in user_creds table.');
        return [];
      }
          
      // Create an array of user objects from the result rows
      const userObjects = res.rows.map(userCreds => ({
        user: username,
        handle: userCreds.handle,
        twitterTokens: {
          access_token: userCreds.twitter_access_token,
          refresh_token: userCreds.twitter_refresh_token
        },
        redditTokens: {
          access_token: userCreds.reddit_access_token,
          refresh_token: userCreds.reddit_refresh_token
        },
        tiktokTokens: {
          access_token: userCreds.tiktok_access_token,
          refresh_token: userCreds.tiktok_refresh_token
        },
        youtubeTokens: {
          access_token: userCreds.youtube_access_token,
          refresh_token: userCreds.youtube_refresh_token
        }
      }));

      return userObjects;
    } finally {
      // Release the client back to the pool
      client.release();
    }
  } catch (error) {
    console.error('Error getting user credentials from user_creds table:', error);
    throw error;
  }
};

const getCredsByUsernameAndHandle = async (username, handle) => {
  if (!username || !handle) {
    throw new Error('Username and handle are required.');
  }

  try {
    // Connect to the pool
    const client = await pool.connect();

    try {
      // Query to get the credentials by username and handle
      const query = `
                SELECT
                    twitter_access_token,
                    twitter_refresh_token,
                    reddit_access_token,
                    reddit_refresh_token,
                    tiktok_access_token,
                    tiktok_refresh_token,
                    youtube_access_token,
                    youtube_refresh_token,
                    handle
                FROM user_creds
                WHERE username = $1 AND handle = $2
            `;
      const res = await client.query(query, [username, handle]);

      if (res.rows.length === 0) {
        console.log('No credentials found for the given username and handle.');
        return null;
      }

      // Return the first (and only) row
      const userCreds = res.rows[0];
      return {
        user: username,
        handle: userCreds.handle,
        twitterTokens: {
          access_token: userCreds.twitter_access_token,
          refresh_token: userCreds.twitter_refresh_token
        },
        redditTokens: {
          access_token: userCreds.reddit_access_token,
          refresh_token: userCreds.reddit_refresh_token
        },
        tiktokTokens: {
          access_token: userCreds.tiktok_access_token,
          refresh_token: userCreds.tiktok_refresh_token
        },
        youtubeTokens: {
          access_token: userCreds.youtube_access_token,
          refresh_token: userCreds.youtube_refresh_token
        }
      };
    } finally {
      // Release the client back to the pool
      client.release();
    }
  } catch (error) {
    console.error('Error getting user credentials from user_creds table:', error);
    // throw error;
  }
};

const getUserNames = async () => {
  try {
    // Connect to the pool
    const client = await pool.connect();

    try {
      // Query to get all usernames
      const query = `
                SELECT username
                FROM user_creds
            `;
      const res = await client.query(query);

      if (res.rows.length === 0) {
        throw new Error('No usernames found in user_creds table.');
      }

      // Extract usernames from the result
      const usernames = res.rows.map(row => row.username);

      return usernames;
    } finally {
      // Release the client back to the pool
      client.release();
    }
  } catch (error) {
    console.error('Error getting usernames from user_creds table:', error);
    throw error;
  }
};

const getUserEmailByUsername = async (username) => {
  if (!username) {
    throw new Error('Username must not be empty or null.');
  }

  try {
    // Connect to the pool
    const client = await pool.connect();

    try {
      // Query to get the email for the given username
      const emailQuery = 'SELECT email FROM users WHERE username = $1';
      const res = await client.query(emailQuery, [username]);

      if (res.rows.length === 0) {
        throw new Error('User not found.');
      }

      // Return the email
      const email = res.rows[0].email;
      console.log(`Email for user ${username}: ${email}`);
      return email;

    } finally {
      // Release the client back to the pool
      client.release();
    }
  } catch (error) {
    throw new Error(`Failed to retrieve email: ${error.message}`);
  }
};

const updateProStatus = async (email, customerId) => {
  // Check for empty or null username
  if (!email) {
    throw new Error('Username must not be empty or null.');
  }

  try {
    // Connect to the pool
    const client = await pool.connect();

    try {
      // Check if the username exists
      const userCheckQuery = 'SELECT * FROM users WHERE email = $1';
      const res = await client.query(userCheckQuery, [email]);

      if (res.rows.length === 0) {
        throw new Error('Username does not exist.');
      }

      // Update the pro status to true for the given username
      const updateQuery = `
                UPDATE users
                SET pro = true, stripe_customer_id = $2
                WHERE email = $1
                RETURNING userid, username, pro;
            `;
      const result = await client.query(updateQuery, [email, customerId]);

      console.log('Pro status updated successfully:', result.rows[0]);

      // Return the updated user details
      return result.rows[0];
    } finally {
      // Release the client back to the pool
      client.release();
    }
  } catch (error) {
    throw new Error(`Failed to update pro status: ${error.message}`);
  }
};

const deactivateProStatus = async (email) => {
  // Check for empty or null email
  if (!email) {
    throw new Error('Email must not be empty or null.');
  }

  try {
    // Connect to the pool
    const client = await pool.connect();

    try {
      // Check if the user exists
      const userCheckQuery = 'SELECT * FROM users WHERE email = $1';
      const res = await client.query(userCheckQuery, [email]);

      if (res.rows.length === 0) {
        throw new Error('User does not exist.');
      }

      // Update the pro status to false for the given email
      const updateQuery = `
                UPDATE users
                SET pro = false
                WHERE email = $1
                RETURNING userid, username, pro;
            `;
      const result = await client.query(updateQuery, [email]);

      console.log('Pro status deactivated successfully:', result.rows[0]);

      // Return the updated user details
      return result.rows[0];
    } finally {
      // Release the client back to the pool
      client.release();
    }
  } catch (error) {
    throw new Error(`Failed to deactivate pro status: ${error.message}`);
  }
};


const insertIntoContactForm = async (contactFormData) => {
  console.log('Inserting into contact form');
  console.log(contactFormData);

  const { username, email, question } = contactFormData;

  const query = `
    INSERT INTO contactform (
      username,
      email,
      question
    ) VALUES (
      $1, $2, $3
    ) RETURNING id;
  `;

  const values = [username, email, question];

  try {
    const client = await pool.connect();
    try {
      const res = await client.query(query, values);
      return res.rows[0]; // Return the newly created contact form entry
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error inserting into contact form', err);
    throw err;
  }
};


module.exports = { 
  registerUserDB, authenticateUserDB, getCredsByUser, updateTwitterCodeVerifier,
  updateTwitterTokens, revokeTwitterTokens, getTwitterCodeVerifierByUsername, updateRedditTokens, revokeRedditTokens,
  updateTikTokTokens, revokeTikTokTokens, updateYouTubeTokens, revokeYouTubeTokens, getUserNames, getCredsByUsernameAndHandle,
  getUserEmailByUsername, updateProStatus, deactivateProStatus, getUpdatedDetails, insertIntoContactForm
};