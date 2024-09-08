import React, { useState, useEffect } from 'react';
import TagInputComponent from './TagInputComponent'; 
import { convertFilesToStringsForRendering, updateFileNamesAsync, getPhotoMetadata } from '../service/userMediaService';
import { useAuth } from '../service/authContext';

const UpdateImageDataModal = ({ imageData, closeModal, updatePhotoMetadata, mediaFiles, uploadedFileNames, user, clearMedia }) => {
  const [updatedData, setUpdatedData] = useState(imageData);
  const [media, setMedia] = useState(mediaFiles);

  const [displayError, setDisplayError] = useState(false);

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

  const handleChange = (e, index) => {
    const { name, value } = e.target;
    let actualValue = value;
    let fieldName = name.split('-')[0]; // This will extract 'NSFW' from 'NSFW-0'

    // If the change is from radio buttons for NSFW, convert value to boolean
    if (fieldName === 'nsfw') {
      actualValue = value === 'true'; // Converts the string 'true'/'false' to boolean
    }

    const newData = [...updatedData];
    newData[index][fieldName] = actualValue;
    setUpdatedData([...newData]);
  };

  useEffect(() => {
    const fetchMetadata = async (fileNames) => {
      try {
        const metadata = await getPhotoMetadata(fileNames, user.username);
        console.log(metadata);
        setUpdatedData(metadata);
      } catch (error) {
        console.error('Error fetching video metadata:', error);
      }
    };

    if (updatedData.length === 0) {
      console.log('No data available, fetching files...');
      console.log(mediaFiles);

      if (mediaFiles && uploadedFileNames) {
        console.log('Media files available, converting to base64...');
        
        updateFileNamesAsync(mediaFiles, uploadedFileNames || mediaFiles.map(file => file.fileName))
          .then(async (fileData) => {
            setMedia(fileData);
            console.log('fileData', fileData);
            fetchMetadata(uploadedFileNames || mediaFiles.map(file => file.fileName));
          })
          .catch((error) => {
            console.error('Error converting files to base64:', error);
          });
        console.log('converted');
      }
    }
  }, [updatedData, mediaFiles, uploadedFileNames, user.username]);

  const handleSave = () => {
  
    // Check if updatedData exists and is an array
    if (updatedData && Array.isArray(updatedData)) {
      // Initialize a flag to check if there are missing fields
      let missingData = false;
  
      // Iterate over each object in the updatedData array
      updatedData.forEach((data) => {
        // Check if description is null or an empty string
        if (!data.description || data.description.trim() === '') {
          missingData = true;
        }
  
        // Check if categories is an empty array or has a length of 0
        if (!data.categories || data.categories.length === 0) {
          missingData = true;
        }
      });
  
      // If any missing data is found, display error and prevent further actions
      if (missingData) {
        setDisplayError(true); // Trigger error display
        return; // Stop further execution if validation fails
      }
  
      // If no errors, proceed with saving the data
      updatePhotoMetadata(updatedData, user.username); 
      if (clearMedia) {
        clearMedia();
      }
      closeModal();
    }
  };

  const renderMedia = (file) => {
    const fileExtension = file.fileName.split('.').pop().toLowerCase();
    const mimeType = getMimeTypeFromExtension(fileExtension);

    if (mimeType.startsWith('image/')) {
      return <img src={`data:${mimeType};base64,${file.fileData}`} alt={file.fileName} style={{ width: '50%', height: 'auto', marginRight: '10px' }} />;
    } else if (mimeType.startsWith('video/')) {
      return (
        <video width="50%" height="auto" controls style={{ marginRight: '10px' }}>
          <source src={`data:${mimeType};base64,${file.fileData}`} type={mimeType} />
          Your browser does not support the video tag.
        </video>
      );
    } else {
      return <p>Unsupported media type</p>;
    }
  };

  if (updatedData.length > 0 && media.length > 0) {
    return (
      <div>
        <div className="modal-backdrop" onClick={closeModal}></div>
        <div className="UpdateImageDataModal">
          <h2>Update Image Data</h2>
          <p>Adding a description and categories to your photos will help our AI optimize your posts.</p>
          <div style={{borderBottom: '.25rem solid #00aff0'}}></div>
          {updatedData.map((item, index) => (
            <div key={index}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1rem', marginTop: '1rem' }}>
                <label style={{ marginRight: '10px' }}>Name:</label>
                <p>{item.name}</p>
                <p>{console.log(item)}</p>
                {renderMedia(media.find(file => file.fileName === item.name))}
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', height: 'auto', marginBottom: '1rem'}}>
                <label style={{ marginRight: 5 }}>Description:</label>
                <textarea
                  name="description"
                  value={item.description}
                  onChange={(e) => handleChange(e, index)}
                  style={{ minHeight: '50px', height: 'auto', resize: 'vertical', width: '100%', borderRadius: '1rem', padding: '1rem'}} 
                />
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                <label style={{ marginRight: 10 }}>Categories:</label>
                <div style={{ display: 'flex', alignContent: 'flex-start' }}>
                  <TagInputComponent 
                    tags={item.categories.map(category => ({ id: category, text: category }))}
                    handleAddition={(tag) => handleChange({ target: { name: 'categories', value: [...item.categories, tag.text] } }, index)}
                    handleDelete={(indexToRemove) => handleChange({ target: { name: 'categories', value: item.categories.filter((_, i) => i !== indexToRemove) } }, index)}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem'}}>
                <label style={{ marginRight: 10 }}>NSFW:</label>
                <input
                  type="radio"
                  name={`nsfw-${index}`} // Unique name for each set
                  value="true"
                  checked={item.nsfw === 'true' || item.nsfw === true}
                  onChange={(e) => handleChange(e, index)}
                  style={{ marginRight: 5 }}
                />
                <label style={{ marginRight: 10 }}>Yes</label>
                <input
                  type="radio"
                  name={`nsfw-${index}`} // Unique name for each set
                  value="false"
                  checked={item.nsfw === 'false' || item.nsfw === false}
                  onChange={(e) => handleChange(e, index)}
                  style={{ marginRight: 5 }}
                />
                <label>No</label>
              </div>
              <div style={{borderBottom: '.25rem solid #00aff0'}}></div>

            </div>
          ))}
          
          <div className='updateImageModalButtons' >
            {displayError && <p style={{padding: '1rem', color: 'red'}}>Please ensure you've added descriptions and categories</p>}
            <button onClick={handleSave}>Save</button>
            <button onClick={closeModal}>Close</button>
          </div>
          
        </div>
      </div>
    );
  }

  return null;
};

export default UpdateImageDataModal;
