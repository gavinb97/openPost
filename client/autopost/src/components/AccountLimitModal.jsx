import React, { useState, useEffect } from 'react';



const AccountLimitModal = ({ closeModal, user, limitReached}) => {
 

    return (
      <div>
        <div className="modal-backdrop" onClick={closeModal}></div>
        <div className="UpdateImageDataModal">
          <h2>Account Details</h2>
         
          <div style={{borderBottom: '.25rem solid #00aff0'}}></div>
          <p>Account: </p>
          
          <div className='updateImageModalButtons' >
            <button>Revoke Access</button>
            <button onClick={closeModal}>Close</button>
          </div>
          
        </div>
      </div>
    );
  

  return null;
};

export default AccountLimitModal;
