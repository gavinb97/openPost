import axios from 'axios';

export const register = async (userName, userPassword, userEmail) => {
    const endpoint = 'http://localhost:3455/register';
    try {
      const response = await axios.post(endpoint, {username: userName, password: userPassword, email: userEmail});
      return response.data;
    } catch (error) {
      console.error('Failed to register', error);
      
      throw error; // Re-throw the error to propagate it further if needed
    }
  };



  export const login = async (userName, userPassword, userEmail) => {
    const endpoint = 'http://localhost:3455/login';
    try {
      const response = await axios.post(endpoint, {username: userName, password: userPassword});
      return response.data;
    } catch (error) {
      console.error('Failed to Login', error);
      
      throw error; // Re-throw the error to propagate it further if needed
    }
  };