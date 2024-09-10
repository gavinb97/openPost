import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';


const AccountLimitModal = ({ closeModal, user, limitReached}) => {
  const navigate = useNavigate();

  const [work, setWork] = useState(limitReached === 'work');

  const getProButtonClick = () => {
    navigate('/pro');
  };

  const determineHeaderText = () => {
    switch (limitReached) {
    case 'authorizedAccounts':
      return (
        <h2>You've reached your free account limit</h2>
      );
    case 'job':
      return (
        <h2>You've reached your free job limit</h2>
      );
    case 'post': 
      return (
        <h2>This is a pro feature</h2>
      );
    case 'work':
      return (
        <h2>Sorry to get your hopes up</h2>
      );
    }
  };

  const determineBodyText = () => {
    switch (limitReached) {
    case 'authorizedAccounts':
      return (
        <p>Subscribe to Pro to authorize more accounts</p>
      );
    case 'job':
      return (
        <p>Subscribe to Pro to create more jobs</p>
      );
    case 'post':
      return (
        <p>Subscribe to Pro to unlock</p>
      );
    case 'work':
      return (
        <p>This feature is coming soon</p>
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
          {!work && <button onClick={getProButtonClick}>Get Pro</button>}
          <button onClick={closeModal}>Close</button>
        </div>
          
      </div>
    </div>
  );
  

  return null;
};

export default AccountLimitModal;
