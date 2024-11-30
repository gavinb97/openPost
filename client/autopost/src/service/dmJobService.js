import axios from 'axios';


export const createDMJob = async (job, userJwt) => {
    // const endpoint = 'https://only-posts.com/setSchedule';
    const endpoint = 'https://only-posts.com/api/dmjob';
    try {
      const response = await axios.post(endpoint, 
        { job: job }, // Payload data
        {
          headers: {
            Authorization: `Bearer ${userJwt}`, // Passing the userJwt as a Bearer token
          },
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error setting schedule', error);
      throw error; // Re-throw the error to propagate it further if needed
    }
  };

  export const getDMJobsByUsername = async (user, userJwt) => {
    const endpoint = 'https://only-posts.com/api/getdmjobs'; // Adjust the endpoint URL if necessary
  
    try {
      const response = await axios.post(endpoint, 
        { username: user }, // Payload data with username
        {
          headers: {
            Authorization: `Bearer ${userJwt}`, // Passing the userJwt as a Bearer token
          },
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error retrieving DM jobs:', error);
      // Optionally re-throw or handle the error as needed
    }
  };