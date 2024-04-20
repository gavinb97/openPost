import axios from 'axios';

export const createScheduledJob = async (schedule) => {
    const endpoint = 'http://localhost:3456/setSchedule';
    console.log('wee')
    try {
      const response = await axios.post(endpoint, {scheduleData: schedule});
      return response.data;
    } catch (error) {
      console.error('error setting schedu;e', error);
      // Handle errors, such as displaying an error message to the user
      throw error; // Re-throw the error to propagate it further if needed
    }
  };