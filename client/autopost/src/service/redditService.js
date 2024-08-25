import axios from 'axios';



export const getRedditLoginUrl = async (username) => {
    const endpoint = 'http://localhost:3455/redditloginurl';
    try {
      const response = await axios.post(endpoint, {username: username});
      return response.data;
    } catch (error) {
      console.error('Error fetching login URL:', error);
      // Handle errors, such as displaying an error message to the user
      throw error; // Re-throw the error to propagate it further if needed
    }
  };


export const revokeRedditAccess = async (username, accessToken, handle) => {
  const endpoint = 'http://localhost:3455/revokereddit';
  try {
      const requestBody = {
          username: username,
          accesstoken: accessToken,
          handle: handle
      };

      const response = await axios.post(endpoint, requestBody);

      // Log the server response to console
      if (response.status === 200) {
          console.log('Reddit access revoked successfully:', response.data);
      } else {
          console.error('Failed to revoke Reddit access:', response.status);
      }
  } catch (error) {
      console.error('Error in revoking Reddit access:', error.response?.data || error.message);
  }
};

export const getSFWSubreddits = async (user) => {
  const endpoint = 'http://localhost:3455/getsfwsubreddits'
  console.log(user.creds.redditTokens)
  console.log('user')
  try {
    const response = await axios.post(endpoint, {token: user.creds.redditTokens.access_token});
    return response.data;
  } catch (error) {
    console.error('Failed to get subreddits', error);
    throw error;
  }
}
