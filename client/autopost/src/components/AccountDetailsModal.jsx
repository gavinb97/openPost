import React, { useState, useEffect } from 'react';
import TagInputComponent from './TagInputComponent'; 
import { convertFilesToStringsForRendering, updateFileNamesAsync, getPhotoMetadata } from '../service/userMediaService';
import { useAuth } from '../service/authContext';
import { revokeTwitterAccess } from '../service/twitterService';
import {  revokeRedditAccess } from '../service/redditService';
import {  revokeGoogleAccess } from '../service/youtubeService';
import {  revokeTikTokAccess } from '../service/tiktokService';

const AccountDetailsModal = ({ closeModal, accountDetails, setAccountDetails}) => {
 
  console.log(accountDetails);
  const revoke = (accountDetails) => {
    if (accountDetails.twitterTokens.access_token !== null) revokeTwitterAccess(accountDetails.user, accountDetails.handle, accountDetails.jwt);
    if (accountDetails.redditTokens.access_token !== null) revokeRedditAccess(accountDetails.user, accountDetails.redditTokens.access_token, accountDetails.handle, accountDetails.jwt);
    if (accountDetails.youtubeTokens.access_token !== null) revokeGoogleAccess(accountDetails.user, accountDetails.youtubeTokens.access_token, accountDetails.handle, accountDetails.jwt);
    if (accountDetails.tiktokTokens.access_token !== null) revokeTikTokAccess(accountDetails.user, accountDetails.tiktokTokens.access_token, accountDetails.handle, accountDetails.jwt);
    closeModal();
  };


  if (accountDetails) {
    return (
      <div>
        <div className="modal-backdrop" onClick={closeModal}></div>
        <div className="UpdateImageDataModal">
          <h2>Account Details</h2>
         
          <div style={{borderBottom: '.25rem solid #00aff0'}}></div>
          <p>Account: {accountDetails.handle}</p>
          
          <div className='updateImageModalButtons' >
            <button onClick={() => revoke(accountDetails)}>Revoke Access</button>
            <button onClick={closeModal}>Close</button>
          </div>
          
        </div>
      </div>
    );
  }

  return null;
};

export default AccountDetailsModal;
