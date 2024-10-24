import axios from 'axios';
import { Buffer } from 'buffer';


const getMimeTypeFromExtension = (extension) => {
  const mimeTypes = {
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif',
    'bmp': 'image/bmp',
    'webp': 'image/webp',
    'mp4': 'video/mp4',
    'avi': 'video/x-msvideo',
    'mov': 'video/quicktime',
    'wmv': 'video/x-ms-wmv',
    // Add other MIME types as needed
  };

  return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
};

const base64ToBlob = (base64String, mimeType) => {
  // Decode base64 string into a Buffer
  const buffer = Buffer.from(base64String, 'base64');

  // Create a Blob from the Buffer
  const blob = new Blob([buffer], { type: mimeType });

  return blob;
};

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

  for (const file of files) {
    // Find the filename with the identifier in the uploadedFileNames array
    const matchingFileName = uploadedFileNames.find(name => name.endsWith(file.name));

    // Only include the file if a matching file name is found and it's different from the original
    if (matchingFileName && matchingFileName !== file.name) {
      // Extract the file extension from the matching file name
      const fileExtension = matchingFileName.split('.').pop();

      // Get the MIME type based on the file extension
      const mimeType = getMimeTypeFromExtension(fileExtension);

      // Create a new file object with the updated name
      const updatedFile = new File([file], matchingFileName, { type: mimeType, lastModified: file.lastModified });

      const base64file = await convertFileToBase64(updatedFile);

      const fileObject = {
        fileName: matchingFileName,
        fileData: base64file,
      };

      renamedFiles.push(fileObject);
    } else {
      console.log('No matching file name found for:', file.name);
    }
  }

  return renamedFiles;
};


export const uploadFile = (file, fileName, username, userJwt) => {
  return new Promise((resolve, reject) => {
    const endpoint = 'https://localhost:3455/api/upload';
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
              Authorization: `Bearer ${userJwt}`, // Passing the userJwt as a Bearer token
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

export const fetchAllFilesByUser = async (username, userJwt) => {
  // const endpoint = 'https://localhost:3455/files';
  const endpoint = 'https://localhost:3455/api/files';
  try {
    const response = await axios.post(endpoint, 
      { username }, // Payload data
      {
        headers: {
          Authorization: `Bearer ${userJwt}`, // Passing the userJwt as a Bearer token
        },
      }
    );

    return response.data; // Return the response data
  } catch (error) {
    console.error('Error fetching files:', error);
    // Handle errors, such as displaying an error message to the user
  }
};

export const fetchAllVideosByUser = async (username, userJwt) => {
  // const endpoint = 'https://localhost:3455/videos';
  const endpoint = 'https://localhost:3455/api/videos';
  try {
    const response = await axios.post(endpoint, 
      { username }, // Payload data
      {
        headers: {
          Authorization: `Bearer ${userJwt}`, // Passing the userJwt as a Bearer token
        },
      }
    );

    return response.data; // Return the response data
  } catch (error) {
    console.error('Error fetching videos:', error);
    // Handle errors, such as displaying an error message to the user
  }
};




export const fetchAllFiles = async () => {
  // const endpoint = 'https://localhost:3455/files';
  const endpoint = 'https://localhost:3455/api/files';
  try {
    const response = await axios.get(endpoint);
      
    return response.data;
  } catch (error) {
    console.error('Error fetching files:', error);
    // Handle errors, such as displaying an error message to the user
  }
};


export const getPhotoFilesByName = async () => {

};


export const deleteByName = async (fileNames, username, userJwt) => {
  try {
    const response = await axios.post('https://localhost:3455/api/deletebyname', 
      { fileNames, username },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userJwt}`, // Passing the userJwt as a Bearer token
        },
      }
    );

    // Optional: Handle the response if needed
    if (response.status === 200) {
      console.log('Files deleted successfully:', response.data);
    }
  } catch (error) {
    console.error('Error deleting files:', error.response?.data || error.message);
  }
};

export const getPhotoMetadata = async (fileNames, username, userJwt) => {
  const endpoint = 'https://localhost:3455/api/getphotometadata';

  try {
    const response = await axios.post(endpoint, 
      { fileNames, username },
      {
        headers: {
          Authorization: `Bearer ${userJwt}`, // Passing the userJwt as a Bearer token
        },
      }
    );
    
    return response.data; // Return the response data
  } catch (error) {
    console.error('Error fetching photo metadata:', error);
    return null; // Return null in case of error
  }
};

export const updatePhotoMetadata = async (newData, username, userJwt) => {

  try {
    const response = await axios.post('https://localhost:3455/api/updatephotometadata', 
      { newData, username },
      {
        headers: {
          Authorization: `Bearer ${userJwt}`, // Passing the userJwt as a Bearer token
        },
      }
    );

    // Optional: Handle the response if needed
    if (response.status === 200) {
      console.log('Photo metadata updated successfully:', response.data);
    }
  } catch (error) {
    console.error('Error updating photo metadata:', error.response?.data?.error || error.message);
  }
};
