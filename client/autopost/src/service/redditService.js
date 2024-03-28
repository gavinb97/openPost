import axios from 'axios';
import { Buffer } from 'buffer';


const base64ToBlob = (base64String) => {
    // Decode base64 string into a Buffer
    const buffer = Buffer.from(base64String, 'base64');
    
    // Create a Blob from the Buffer
    const blob = new Blob([buffer], { type: 'image/png' }); // Adjust the MIME type according to your file type

    return blob;
}

export const uploadFile = async (file, fileName) => {
    const endpoint = 'http://localhost:3455/upload';

    // Convert file to base64
    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onload = async () => {
        // Convert base64 string to Blob
        const base64String = reader.result.split(',')[1]; // Remove data URL prefix
        const blob = base64ToBlob(base64String);

        // Create FormData object
        const bodyForm = new FormData();
        bodyForm.append('file', blob, fileName);
        bodyForm.append('categories', JSON.stringify(['cat', 'god'])); // Convert categories array to JSON string

        try {
            const uploadResponse = await axios.post(
                endpoint,
                bodyForm, {
                    headers: {
                        'Content-Type': 'multipart/form-data', // Ensure proper Content-Type header
                    },
                }
            );
            console.log(uploadResponse.data);
            return uploadResponse.data;
        } catch (error) {
            // Handle error
            console.error('Error uploading file:', error);
            throw error;
        }
    };
};


export const fetchAllFiles = async () => {
    const endpoint = 'http://localhost:3455/files';
    try {
      const response = await axios.get(endpoint);
      
      return response.data
    } catch (error) {
      console.error('Error fetching files:', error);
      // Handle errors, such as displaying an error message to the user
    }
  };

export const deleteByName = async (fileNames) => {
    console.log(fileNames)
    try {
        const response = await axios.post('http://localhost:3455/deletebyname', fileNames,
        {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        console.log(response.data);
    } catch (error) {
        console.error('Error deleting files:', error.response.data);
    }
}
