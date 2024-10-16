import axios from 'axios';



export const getYoutubeLoginUrl = async (username, userJwt) => {
  const endpoint = 'https://onlypostsai.com/api/googleloginurl';
  
  try {
    const response = await axios.post(endpoint, 
      { username: username },
      {
        headers: {
          Authorization: `Bearer ${userJwt}`, // Passing the userJwt as a Bearer token
        },
      }
    );
    
    return response.data; // Return the response data
  } catch (error) {
    console.error('Error fetching login URL:', error);
    throw error; // Re-throw the error to propagate it further if needed
  }
};


export const revokeGoogleAccess = async (username, accessToken, handle, userJwt) => {
  const endpoint = 'https://onlypostsai.com/api/revokeGoogleAccess';

  try {
    // Make a POST request to the revokeGoogleAccess endpoint
    const response = await axios.post(endpoint, 
      { accessToken: accessToken, username: username, handle },
      {
        headers: {
          Authorization: `Bearer ${userJwt}`, // Passing the userJwt as a Bearer token
        },
      }
    );

    if (response.status === 200) {
      console.log('Success:', response.data);
      return { success: true, message: response.data.message };
    } else {
      console.log('Failed to revoke:', response.status, response.data);
      return { success: false, message: response.data.error || 'Failed to revoke access token' };
    }
  } catch (error) {
    console.error('Error in revoking access token:', error);
    return { success: false, message: error.response?.data.error || 'Error occurred while revoking access token' };
  }
};
