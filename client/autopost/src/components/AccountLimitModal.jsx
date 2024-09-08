import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';


const AccountLimitModal = ({ closeModal, user, limitReached}) => {
  const navigate = useNavigate();

  const getProButtonClick = () => {
    navigate('/pro');
  };

  const determineHeaderText = () => {
    switch (limitReached) {
    case 'authorizedAccounts':
      return (
        <h2>You've reached your free account limit</h2>
      );
    }
  };

  const determineBodyText = () => {
    switch (limitReached) {
    case 'authorizedAccounts':
      return (
        <p>Subscribe to Pro to authorize more accounts</p>
      );
    }
  };


  return (
    <div>
      <div className="modal-backdrop" onClick={closeModal}></div>
      <div className="UpdateImageDataModal">
        {determineHeaderText()}
         
        <div style={{borderBottom: '.25rem solid #00aff0'}}></div>
        {determineBodyText()}
          
        <div className='updateImageModalButtons' >
          <button onClick={getProButtonClick}>Get Pro</button>
          <button onClick={closeModal}>Close</button>
        </div>
          
      </div>
    </div>
  );
  

  return null;
};

export default AccountLimitModal;
