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