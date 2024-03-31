import React, { useState } from 'react';
import TagInputComponent from './TagInputComponent'; 

const UpdateImageDataModal = ({ imageData, closeModal, updatePhotoMetadata }) => {
  const [updatedData, setUpdatedData] = useState(imageData);

  const handleChange = (e, index) => {
    const { name, value } = e.target;
    const newData = [...updatedData];
    newData[index][name] = value;
    setUpdatedData(newData);
  };

  const handleSave = () => {
    // Perform save operation with updatedData
    console.log(updatedData);
    // Call updatePhotoMetadata function to update data
    updatePhotoMetadata(updatedData); // Pass updatedData to the function
    // Close modal
    closeModal();
  };

  return (
    <div className="modal-container">
      <div className="modal-backdrop" onClick={closeModal}></div>
      <div className="UpdateImageDataModal">
        <h2>Update Image Data</h2>
        {updatedData.map((item, index) => (
          <div key={index}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px', margin: '5px' }}>
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
              {/* <TagInputComponent 
                tags={item.categories.map(category => ({ id: category, text: category }))}
                handleAddition={(tag) => handleChange({ target: { name: 'categories', value: [...item.categories, tag.text] } }, index)}
                handleDelete={(indexToRemove) => handleChange({ target: { name: 'categories', value: item.categories.filter((_, i) => i !== indexToRemove) } }, index)}
              /> */}
            </div>
          </div>
        ))}
        <button onClick={handleSave}>Save</button>
        <button onClick={closeModal}>Close</button>
      </div>
    </div>
  );
};

export default UpdateImageDataModal;
