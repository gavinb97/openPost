import axios from 'axios';

export const getTwitterLoginUrl = async (username, userJwt) => {
  // const endpoint = 'http://localhost:3455/twitterloginurl';
  const endpoint = 'https://only-posts.com/api/twitterloginurl';
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
    console.error('Error fetching Twitter login URL:', error);
    throw error; // Re-throw the error to propagate it further if needed
  }
};


export const revokeTwitterAccess = async (username, handle, userJwt) => {
  // const endpoint = 'http://localhost:3455/revoketwitter';
  const endpoint = 'https://only-posts.com/api/revoketwitter';
  try {
    const response = await axios.post(endpoint, 
      { username, handle }, // Payload data
      {
        headers: {
          Authorization: `Bearer ${userJwt}`, // Passing the userJwt as a Bearer token
        },
      }
    );

    // Log the server response to console
    if (response.status === 200) {
      console.log('Twitter access revoked successfully:', response.data);
    } else {
      console.error('Failed to revoke Twitter access:', response.status);
    }
  } catch (error) {
    console.error('Error in revoking Twitter access:', error.response?.data || error.message);
  }
};
