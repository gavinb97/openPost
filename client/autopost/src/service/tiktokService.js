import axios from 'axios';

export const getTikTokLoginUrl = async (username) => {
  const endpoint = 'http://localhost:3455/tiktokloginurl';
  try {
    const response = await axios.post(endpoint, {username: username});
    return response.data;
  } catch (error) {
    console.error('Error fetching login URL:', error);
    // Handle errors, such as displaying an error message to the user
    throw error; // Re-throw the error to propagate it further if needed
  }
};


export const revokeTikTokAccess = async (username, accessToken, handle) => {
  const endpoint = 'http://localhost:3455/revoketiktok';
  try {
    // Prepare the request payload
    const requestBody = {
      username: username,
      accesstoken: accessToken,
      handle: handle
    };

    // Send a POST request to the server
    const response = await axios.post(endpoint, requestBody);

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