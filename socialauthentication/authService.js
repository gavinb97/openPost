const fs = require('fs')

const getUserByUsername = async (filename, username) => {
    try {
        // Read the JSON data from the file
        const jsonData = await fs.promises.readFile(filename, 'utf8');
        const dataArray = JSON.parse(jsonData);

        // Find the object with the specified username
        const userObject = dataArray.find(obj => obj.user === username);

        return userObject;
    } catch (error) {
        console.error('Error reading file or parsing JSON:', error);
        throw error;
    }
};

module.exports = {
    getUserByUsername
}