import React, { useState } from 'react';


const UpdateImageDataModal = ({ imageData, closeModal }) => {
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
    // Close modal
    closeModal();
    // Implement your save operation logic here
  };

  return (
    <div className="modal-container">
      <div className="modal-backdrop" onClick={closeModal}></div>
      <div className="UpdateImageDataModal">
        <h2>Update Image Data</h2>
        {updatedData.map((item, index) => (
          <div key={index}>
            <label>Name:</label>
            <p>{item.name}</p>
            <div>
              <label>Description:</label>
              <input
                type="text"
                name="description"
                value={item.description}
                onChange={(e) => handleChange(e, index)}
              />
            </div>
            <div>
              <label>Categories:</label>
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
