import axios from 'axios';
import { Buffer } from 'buffer';


const base64ToBlob = (base64String) => {
    // Decode base64 string into a Buffer
    const buffer = Buffer.from(base64String, 'base64');
    
    // Create a Blob from the Buffer
    const blob = new Blob([buffer], { type: 'image/png' }); // Adjust the MIME type according to your file type

    return blob;
}

export const uploadFile = (file, fileName) => {
    return new Promise((resolve, reject) => {
        const endpoint = 'http://localhost:3456/upload';

        const reader = new FileReader();
        reader.readAsDataURL(file);

        reader.onload = async () => {
            const base64String = reader.result.split(',')[1];
            const blob = base64ToBlob(base64String);

            const bodyForm = new FormData();
            bodyForm.append('file', blob, fileName);
            bodyForm.append('categories', JSON.stringify([]));

            try {
                const uploadResponse = await axios.post(
                    endpoint,
                    bodyForm, {
                        headers: {
                            'Content-Type': 'multipart/form-data',
                        },
                    }
                );
                console.log(uploadResponse.data);
                resolve(uploadResponse.data); // Resolve the promise with the response data
            } catch (error) {
                console.error('Error uploading file:', error);
                reject(error); // Reject the promise with the error
            }
        };

        reader.onerror = (error) => {
            console.error('Error reading file:', error);
            reject(error); // Reject the promise with the error
        };
    });
};



export const fetchAllFiles = async () => {
    const endpoint = 'http://localhost:3456/files';
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
        const response = await axios.post('http://localhost:3456/deletebyname', fileNames,
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

export const getPhotoMetadata = async (fileNames) => {
    console.log('called metadatacall')
    const endpoint = 'http://localhost:3456/getphotometadata'
    try {
        const response = await axios.post(endpoint, fileNames);
        return response.data;
    } catch (error) {
        console.error('Error fetching photo metadata:', error);
        return null;
    }
};

export const updatePhotoMetadata = async (newData) => {
    try {
        const response = await axios.post('http://localhost:3456/updatephotometadata', newData);
        console.log(response.data); // Log success message
    } catch (error) {
        console.error('Error updating photo metadata:', error.response.data.error);
    }
};
