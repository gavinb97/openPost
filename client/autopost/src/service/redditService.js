import axios from 'axios';



export const getRedditLoginUrl = async (username) => {
    const endpoint = 'http://localhost:3455/redditloginurl';
    try {
      const response = await axios.post(endpoint, {username: username});
      return response.data;
    } catch (error) {
      console.error('Error fetching login URL:', error);
      // Handle errors, such as displaying an error message to the user
      throw error; // Re-throw the error to propagate it further if needed
    }
  };


export const revokeRedditAccess = async (username, accessToken) => {
  const endpoint = 'http://localhost:3455/revokereddit';
  try {
      const requestBody = {
          username: username,
          accesstoken: accessToken
      };

      const response = await axios.post(endpoint, requestBody);

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
