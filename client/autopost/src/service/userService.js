import axios from 'axios';

export const register = async (userName, userPassword, userEmail) => {
  const endpoint = 'https://only-posts.com/api/register';
  try {
    const response = await axios.post(endpoint, {username: userName, password: userPassword, email: userEmail});
    return response.data;
  } catch (error) {
    console.error('Failed to register', error);
      
    throw error; // Re-throw the error to propagate it further if needed
  }
};

 

export const login = async (userName, userPassword, userEmail) => {
  const endpoint = 'https://only-posts.com/api/login';

  try {
    const response = await axios.post(endpoint, {username: userName, password: userPassword});
    return response.data;
  } catch (error) {
    console.error('Failed to Login', error);
    throw error; // Re-throw the error to propagate it further if needed
  }
};

export const getUpdatedDetails = async (userName, userJwt) => {
  const endpoint = 'https://only-posts.com/api/updateddetails';

  try {
    const response = await axios.post(endpoint, 
      { username: userName },
      {
        headers: {
          Authorization: `Bearer ${userJwt}`, // Passing the userJwt as a Bearer token
        },
      }
    );

    console.log(response.data);
    console.log('response data^6');
    return response.data; // Return the response data
  } catch (error) {
    console.error('Failed to fetch updated details', error);
    throw error; // Re-throw the error to propagate it further if needed
  }
};

export const getUserCreds = async (username, userJwt) => {
  const endpoint = 'https://only-posts.com/api/getUserCreds';

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
    console.error('Failed to fetch user credentials', error);
    throw error; // Re-throw the error to propagate it further if needed
  }
};

export const fetchUserEmail = async (username, userJwt) => {
  const endpoint = 'https://only-posts.com/api/getemail';

  try {
    const response = await axios.post(endpoint, 
      { username: username },
      {
        headers: {
          Authorization: `Bearer ${userJwt}`, // Passing the userJwt as a Bearer token
        },
      }
    );

    return response.data.email; // Return the email from the response data
  } catch (error) {
    console.error('Failed to fetch email', error);
    throw error; // Re-throw the error to propagate it further if needed
  }
};

export const getBillingPortal = async (customerId, userJwt) => {
  const endpoint = 'https://only-posts.com/api/billing_session_url';

  try {
    const response = await axios.post(endpoint, 
      { customerId: customerId },
      {
        headers: {
          Authorization: `Bearer ${userJwt}`, // Passing the userJwt as a Bearer token
        },
      }
    );

    return response.data; // Return the response data
  } catch (error) {
    console.error('Failed to fetch billing portal', error);
    throw error; // Re-throw the error to propagate it further if needed
  }
};

export const submitContactForm = async (contactFormData) => {
  const endpoint = 'https://only-posts.com/api/contactFormSubmit';

  try {
    const response = await axios.post(endpoint, contactFormData, {
      headers: {
        'Content-Type': 'application/json', // Specify the content type
      },
    });

    return response.data; // Return the response data (could include confirmation or ID)
  } catch (error) {
    console.error('Failed to submit contact form', error);
    throw error; // Re-throw the error to propagate it further if needed
  }
};



