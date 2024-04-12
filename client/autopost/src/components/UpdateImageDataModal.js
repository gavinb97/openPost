import React, { useState, useEffect } from 'react';
import TagInputComponent from './TagInputComponent'; 
import { convertFilesToStringsForRendering, updateFileNamesAsync, fetchAllFiles, getPhotoMetadata } from '../service/userMediaService'

const UpdateImageDataModal = ({ imageData, closeModal, updatePhotoMetadata, mediaFiles, uploadedFileNames }) => {
  const [updatedData, setUpdatedData] = useState(imageData);

  const [media, setMedia] = useState(mediaFiles)
 

  const handleChange = (e, index) => {
    const { name, value } = e.target;
    const newData = [...updatedData];
    newData[index][name] = value;
    setUpdatedData(newData);
  };
  

  useEffect(() => {
    
    if (updatedData.length === 0) {
        console.log('No data available, fetching files...');
        
        if (mediaFiles) {
            console.log('Media files available, converting to base64...');
            
            updateFileNamesAsync(mediaFiles, uploadedFileNames)
                .then(async (fileData) => {
                    console.log(fileData)
                    // mediaFiles = fileData;
                    setMedia(fileData)
                    
                    const metaData = await getPhotoMetadata(uploadedFileNames);
                    // console.log(metaData);
                    // do {
                    //   console.log('waiting on the metaData')
                
                    // } while (metaData.length === 0)
                    setUpdatedData(metaData)
                })
                .catch((error) => {
                    console.error('Error converting files to base64:', error);
                });
            console.log('converted');
            console.log(mediaFiles);
                
        }
    }
    
}, []);

  const handleSave = () => {
    // Perform save operation with updatedData
    console.log(updatedData);
    // Call updatePhotoMetadata function to update data
    updatePhotoMetadata(updatedData); // Pass updatedData to the function
    // Close modal
    closeModal();
  };

  const getFileExtension = (fileName) => {
    return fileName.split('.').pop().toLowerCase();
  };




if (updatedData.length > 0 && media.length > 0) {
  console.log('must be greater than')
  console.log(media)
  return (
    <div className="modal-container">
      <div className="modal-backdrop" onClick={closeModal}></div>
      <div className="UpdateImageDataModal">
        <h2>Update Image Data</h2>
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
          </div>
        ))}
        <button onClick={handleSave}>Save</button>
        <button onClick={closeModal}>Close</button>
      </div>
    </div>
  );
};
}
//   return (
//     <div className="modal-container">
//       <div className="modal-backdrop" onClick={closeModal}></div>
//       <div className="UpdateImageDataModal">
//         <h2>Update Image Data</h2>
//         {updatedData.map((item, index) => (
//           <div key={index}>
//             <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px', margin: '5px', marginTop: '6%' }}>
//             <img src={`data:image;base64,${mediaFiles.find(file => file.fileName === item.name).fileData}`} alt={item.name} style={{ width: '50%', height: 'auto', marginRight: '10px' }} />
//                 <label style={{ marginRight: '10px' }}>Name:</label>
//                 <p>{item.name}</p>
//             </div>
            
//             <div style={{ display: 'flex', alignItems: 'center', height: 'auto', marginBottom: '10px', border: '1px solid grey', margin: '5px' }}>
//               <label style={{ marginRight: 5 }}>Description:</label>
//               <textarea
//                 name="description"
//                 value={item.description}
//                 onChange={(e) => handleChange(e, index)}
//                 style={{ minHeight: '50px', height: 'auto', resize: 'vertical' }} // Set flexible height
//               />
//             </div>
            
//             <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' , border: '1px solid grey', margin: '5px'}}>
//               <label style={{ marginRight: 10 }}>Categories:</label>
//               <div style={{display: 'flex', alignContent: 'flex-start'}}>
//               <TagInputComponent 
//                 tags={item.categories.map(category => ({ id: category, text: category }))}
//                 handleAddition={(tag) => handleChange({ target: { name: 'categories', value: [...item.categories, tag.text] } }, index)}
//                 handleDelete={(indexToRemove) => handleChange({ target: { name: 'categories', value: item.categories.filter((_, i) => i !== indexToRemove) } }, index)}
//               />
//               </div>
//             </div>
//           </div>
//         ))}
//         <button onClick={handleSave}>Save</button>
//         <button onClick={closeModal}>Close</button>
//       </div>
//     </div>
//   );
// };

export default UpdateImageDataModal;
