import React, { useState, useEffect } from 'react';
import TagInputComponent from './TagInputComponent'; 
import { convertFilesToStringsForRendering, updateFileNamesAsync, getPhotoMetadata } from '../service/userMediaService'
import { useAuth } from '../service/authContext';

const UpdateImageDataModal = ({ imageData, closeModal, updatePhotoMetadata, mediaFiles, uploadedFileNames, user }) => {
  const [updatedData, setUpdatedData] = useState(imageData);
  
  const [media, setMedia] = useState(mediaFiles)
 
  const handleChange = (e, index) => {
    const { name, value } = e.target;
    let actualValue = value;
    let fieldName = name.split('-')[0];  // This will extract 'NSFW' from 'NSFW-0'

    // If the change is from radio buttons for NSFW, convert value to boolean
    if (fieldName === 'NSFW') {
        actualValue = value === 'true'; // Converts the string 'true'/'false' to boolean
    }
  
    const newData = [...updatedData];
    newData[index][fieldName] = actualValue;
    setUpdatedData([...newData]);
};
  
  

  useEffect(() => {
    
    if (updatedData.length === 0) {
        console.log('No data available, fetching files...');
        
        if (mediaFiles) {
            console.log('Media files available, converting to base64...');
            
            updateFileNamesAsync(mediaFiles, uploadedFileNames)
                .then(async (fileData) => {
                   
                    setMedia(fileData)
                    
                    const metaData = await getPhotoMetadata(uploadedFileNames, user.username);
                 
                    setUpdatedData(metaData)
                })
                .catch((error) => {
                    console.error('Error converting files to base64:', error);
                });
            console.log('converted');
              
        }
    }
    
}, []);

  const handleSave = () => {
    // Perform save operation with updatedData
    // Call updatePhotoMetadata function to update data
    updatePhotoMetadata(updatedData, user.username); // Pass updatedData to the function
    // Close modal
    closeModal();
  };

  const getFileExtension = (fileName) => {
    return fileName.split('.').pop().toLowerCase();
  };




if (updatedData.length > 0 && media.length > 0) {
 
  return (
    <div>
      <div className="modal-backdrop" onClick={closeModal}></div>
      <div className="UpdateImageDataModal">
        <h2>Update Image Data</h2>
        <p>Adding a description and categories to your photos will help our AI optimize your posts.</p>
        {updatedData.map((item, index) => (
          <div key={index}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px', margin: '5px', marginTop: '6%' }}>
            <img src={`data:image;base64,${media.find(file => file.fileName === item.name).fileData}`} alt={item.name} style={{ width: '50%', height: 'auto', marginRight: '10px' }} />
                <label style={{ marginRight: '10px' }}>Name:</label>
                <p>{item.name}</p>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', height: 'auto', marginBottom: '10px', border: '1px solid grey', margin: '5px' }}>
              <label style={{ marginRight: 5 }}>Description:</label>
              <textarea
                name="description"
                value={item.description}
                onChange={(e) => handleChange(e, index)}
                style={{ minHeight: '50px', height: 'auto', resize: 'vertical' }} // Set flexible height
              />
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' , border: '1px solid grey', margin: '5px'}}>
              <label style={{ marginRight: 10 }}>Categories:</label>
              <div style={{display: 'flex', alignContent: 'flex-start'}}>
              <TagInputComponent 
                tags={item.categories.map(category => ({ id: category, text: category }))}
                handleAddition={(tag) => handleChange({ target: { name: 'categories', value: [...item.categories, tag.text] } }, index)}
                handleDelete={(indexToRemove) => handleChange({ target: { name: 'categories', value: item.categories.filter((_, i) => i !== indexToRemove) } }, index)}
              />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px', border: '1px solid grey', margin: '5px' }}>
                <label style={{ marginRight: 10 }}>NSFW:</label>
                <input
                  type="radio"
                  name={`NSFW-${index}`}  // Unique name for each set
                  value="true"
                  checked={item.NSFW === true}
                  onChange={(e) => handleChange(e, index)}
                  style={{ marginRight: 5 }}
                />
                <label style={{ marginRight: 10 }}>Yes</label>
                <input
                  type="radio"
                  name={`NSFW-${index}`}  // Unique name for each set
                  value="false"
                  checked={item.NSFW === false}
                  onChange={(e) => handleChange(e, index)}
                  style={{ marginRight: 5 }}
                />
                <label>No</label>
              </div>
              
          </div>
        ))}
        <button onClick={handleSave}>Save</button>
        <button onClick={closeModal}>Close</button>
      </div>
    </div>
  );
};
}

export default UpdateImageDataModal;
