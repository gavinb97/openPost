import axios from 'axios';



export const getYoutubeLoginUrl = async () => {
    const endpoint = 'http://localhost:3455/googleloginurl';
    try {
      const response = await axios.get(endpoint);
      return response.data;
    } catch (error) {
      console.error('Error fetching login URL:', error);
      // Handle errors, such as displaying an error message to the user
      throw error; // Re-throw the error to propagate it further if needed
    }
  };
