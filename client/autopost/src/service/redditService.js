import axios from 'axios';



export const getRedditLoginUrl = async (username, userJwt) => {
  // const endpoint = 'http://localhost:3455/redditloginurl';
  const endpoint = 'https://only-posts.com/api/redditloginurl';
  try {
    const response = await axios.post(endpoint, 
      { username }, // Payload data
      {
        headers: {
          Authorization: `Bearer ${userJwt}`, // Passing the userJwt as a Bearer token
        },
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error fetching login URL:', error);
    throw error; // Re-throw the error to propagate it further if needed
  }
};



export const revokeRedditAccess = async (username, accessToken, handle, userJwt) => {
  // const endpoint = 'http://localhost:3455/revokereddit';
  const endpoint = 'https://only-posts.com/api/revokereddit';
  try {
    const requestBody = {
      username: username,
      accesstoken: accessToken,
      handle: handle
    };

    const response = await axios.post(endpoint, requestBody, {
      headers: {
        Authorization: `Bearer ${userJwt}`, // Pass the userJwt in the Authorization header
      }
    });

    // Log the server response to console
    if (response.status === 200) {
      console.log('Reddit access revoked successfully:', response.data);
    } else {
      console.error('Failed to revoke Reddit access:', response.status);
    }
  } catch (error) {
    console.error('Error in revoking Reddit access:', error.response?.data || error.message);
  }
};


export const getSFWSubreddits = async (user, userJwt) => {
  // const endpoint = 'http://localhost:3455/getsfwsubreddits';
  const endpoint = 'https://only-posts.com/api/getsfwsubreddits';
  try {
    const response = await axios.post(endpoint, 
      { token: user.redditTokens.access_token }, // Payload data
      {
        headers: {
          Authorization: `Bearer ${userJwt}`, // Passing the userJwt as a Bearer token
        },
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Failed to get subreddits', error);
    throw error;
  }
};