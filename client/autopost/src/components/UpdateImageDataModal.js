import React, { useState } from 'react';

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
          <div key={index} >
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                <label style={{ marginRight: '10px' }}>Name:</label>
                <p>{item.name}</p>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
              <label style={{marginRight: 5}}>Description:   </label>
              
              <textarea
                name="description"
                value={item.description}
                onChange={(e) => handleChange(e, index)}
                style={{ minHeight: '50px', resize: 'vertical' }} // Set flexible height
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
              <label style={{marginRight: 10}}>Categories:</label>
              <input
                type="text"
                name="categories"
                value={item.categories.join(', ')} // Convert array to string for display
                onChange={(e) =>
                  handleChange(
                    { target: { name: 'categories', value: e.target.value.split(', ') } }, // Convert string back to array
                    index
                  )
                }
              />
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
