import axios from 'axios';
import { Buffer } from 'buffer';


const base64ToBlob = (base64String) => {
    // Decode base64 string into a Buffer
    const buffer = Buffer.from(base64String, 'base64');
    
    // Create a Blob from the Buffer
    const blob = new Blob([buffer], { type: 'image/png' }); // Adjust the MIME type according to your file type

    return blob;
}

const convertFileToBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
        const base64String = event.target.result.split(',')[1];  // Remove 'data:image;base64,' prefix
        resolve(base64String);
    };
    reader.onerror = (error) => reject(error);

    reader.readAsDataURL(file);
});

export const updateFileNamesAsync = async (files, uploadedFileNames) => {
    const renamedFiles = [];

    files.forEach(async file => {
        // Find the filename with the identifier in the uploadedFileNames array
        const matchingFileName = uploadedFileNames.find(name => name.endsWith(file.name));

        // Only include the file if a matching file name is found and it's different from the original
        if (matchingFileName && matchingFileName !== file.name) {
            // Create a new file object with the updated name
            const updatedFile = new File([file], matchingFileName, { type: file.type, lastModified: file.lastModified });
            
            const base64file = await convertFileToBase64(updatedFile)
            
            const fileObject = {
                fileName: matchingFileName,
                fileData: base64file
            }

            renamedFiles.push(fileObject);
        } else {
            console.log('No matching file name found for:', file.name);
        }
    });

    console.log('Renamed files:', renamedFiles);
    return renamedFiles;
};




export const uploadFile = (file, fileName, username) => {
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
            bodyForm.append('username', username);

            try {
                const uploadResponse = await axios.post(
                    endpoint,
                    bodyForm,
                    {
                        headers: {
                            'Content-Type': 'multipart/form-data',
                        },
                    }
                );
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

export const fetchAllFilesByUser = async (username) => {
    const endpoint = 'http://localhost:3456/files';
    try {
      const response = await axios.post(endpoint, { username: username});
      
      return response.data
    } catch (error) {
      console.error('Error fetching files:', error);
      // Handle errors, such as displaying an error message to the user
    }
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


export const getPhotoFilesByName = async () => {

}


export const deleteByName = async (fileNames, username) => {
    try {
        const response = await axios.post('http://localhost:3456/deletebyname', {fileNames, username},
        {
            headers: {
                'Content-Type': 'application/json'
            }
        });
    } catch (error) {
        console.error('Error deleting files:', error.response.data);
    }
}

export const getPhotoMetadata = async (fileNames, username) => {
    const endpoint = 'http://localhost:3456/getphotometadata'
    try {
        const response = await axios.post(endpoint, {fileNames, username});
        return response.data;
    } catch (error) {
        console.error('Error fetching photo metadata:', error);
        return null;
    }
};

export const updatePhotoMetadata = async (newData, username) => {
    try {
        const response = await axios.post('http://localhost:3456/updatephotometadata', {newData, username});
    } catch (error) {
        console.error('Error updating photo metadata:', error.response.data.error);
    }
};
