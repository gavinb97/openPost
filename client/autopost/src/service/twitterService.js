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
