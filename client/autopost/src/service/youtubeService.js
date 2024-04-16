import axios from 'axios';



export const getYoutubeLoginUrl = async (username) => {
    const endpoint = 'http://localhost:3455/googleloginurl';
    try {
      const response = await axios.post(endpoint, {username: username});
      return response.data;
    } catch (error) {
      console.error('Error fetching login URL:', error);
      // Handle errors, such as displaying an error message to the user
      throw error; // Re-throw the error to propagate it further if needed
    }
  };


export const revokeGoogleAccess = async (username, accessToken) => {
  const endpoint = 'http://localhost:3455/revokeGoogleAccess';
    try {
        // Make a POST request to the revokeGoogleAccess endpoint
        const response = await axios.post(endpoint, { accessToken: accessToken, username: username });
        if (response.status === 200) {
            console.log('Success:', response.data);
            return { success: true, message: response.data.message };
        } else {
            console.log('Failed to revoke:', response.status, response.data);
            return { success: false, message: response.data.error || 'Failed to revoke access token' };
        }
    } catch (error) {
        console.error('Error in revoking access token:', error);
        return { success: false, message: error.response?.data.error || 'Error occurred while revoking access token' };
    }
};
