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

export const getUpdatedDetails = async (userName) => {
  const endpoint = 'http://localhost:3455/updateddetails';
  try {
    const response = await axios.post(endpoint, {username: userName });
    console.log(response.data);
    console.log('response data^6');
    return response.data;
  } catch (error) {
    console.error('Failed to Login', error);
      
    throw error; // Re-throw the error to propagate it further if needed
  }
};

export const getUserCreds = async (username) => {
  const endpoint = 'http://localhost:3455/getUserCreds';

  try {
    const response = await axios.post(endpoint, {username: username});
    return response.data;
  } catch (error) {
    console.error('Failed to Login', error);
    throw error;
  }
};

export const fetchUserEmail = async (username) => {
  const endpoint = 'http://localhost:3455/getemail'; 

  try {
   
    const response = await axios.post(endpoint, { username: username });
 
    return response.data.email;
  } catch (error) {
    console.error('Failed to fetch email', error);
    throw error;
  }
};

export const getBillingPortal = async (customerId) => {
  const endpoint = 'http://localhost:3455/billing_session_url'; 

  try {
   
    const response = await axios.post(endpoint, { customerId: customerId });
 
    return response.data;
  } catch (error) {
    console.error('Failed to fetch email', error);
    throw error;
  }
  
};



