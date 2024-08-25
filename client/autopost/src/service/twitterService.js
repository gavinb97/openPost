import axios from 'axios';

export const getTwitterLoginUrl = async (username) => {
    const endpoint = 'http://localhost:3455/twitterloginurl';
    try {
      const response = await axios.post(endpoint, {username: username});
      return response.data;
    } catch (error) {
      console.error('Error fetching login URL:', error);
      // Handle errors, such as displaying an error message to the user
      throw error; // Re-throw the error to propagate it further if needed
    }
  };


export const revokeTwitterAccess = async (username, handle) => {
  const endpoint = 'http://localhost:3455/revoketwitter';
  try {
      const response = await axios.post(endpoint, { username: username, handle: handle });

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
