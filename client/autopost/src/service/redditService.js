import axios from 'axios';



export const getRedditLoginUrl = async () => {
    const endpoint = 'http://localhost:3455/redditloginurl';
    try {
      const response = await axios.post(endpoint, {username: 'anotherGuy'});
      return response.data;
    } catch (error) {
      console.error('Error fetching login URL:', error);
      // Handle errors, such as displaying an error message to the user
      throw error; // Re-throw the error to propagate it further if needed
    }
  };
