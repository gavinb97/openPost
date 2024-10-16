import axios from 'axios';

export const getTikTokLoginUrl = async (username, userJwt) => {
  // const endpoint = 'https://localhost:3455/tiktokloginurl';
  const endpoint = 'https://only-posts.com/api/tiktokloginurl';
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
    console.error('Error fetching TikTok login URL:', error);
    throw error; // Re-throw the error to propagate it further if needed
  }
};



export const revokeTikTokAccess = async (username, accessToken, handle, userJwt) => {
  // const endpoint = 'https://localhost:3455/revoketiktok';
  const endpoint = 'https://only-posts.com/api/revoketiktok';
  try {
    // Prepare the request payload
    const requestBody = {
      username: username,
      accesstoken: accessToken,
      handle: handle
    };

    // Send a POST request to the server with Authorization header
    const response = await axios.post(endpoint, requestBody, {
      headers: {
        Authorization: `Bearer ${userJwt}`, // Passing the userJwt as a Bearer token
      },
    });

    // Check for successful response
    if (response.status === 200) {
      console.log('TikTok access revoked successfully:', response.data);
    } else {
      console.error('Failed to revoke TikTok access:', response.status);
    }
  } catch (error) {
    console.error('Error in revoking TikTok access:', error.response?.data || error.message);
  }
};
