import React, { useState } from 'react';
import '../App.css';

const AuthorizeAccounts = () => {
    const [twitterAccounts, setTwitterAccounts] = useState([]);
    const [redditAccounts, setRedditAccounts] = useState([]);
    const [youtubeAccounts, setYoutubeAccounts] = useState([]);
    const [tiktokAccounts, setTiktokAccounts] = useState([]);

    const handleAddAccount = (platform) => {
        switch(platform) {
            case 'Twitter':
                setTwitterAccounts([...twitterAccounts, {}]);
                break;
            case 'Reddit':
                setRedditAccounts([...redditAccounts, {}]);
                break;
            case 'YouTube':
                setYoutubeAccounts([...youtubeAccounts, {}]);
                break;
            case 'TikTok':
                setTiktokAccounts([...tiktokAccounts, {}]);
                break;
            default:
                break;
        }
    };

    const renderPlatformBox = (platform, accounts, handleAdd) => {
        return (
            <div className='authorize-container'>
                <div className='authorize-box'>
                    <p>Authorize {platform} Accounts</p>
                    <button onClick={() => handleAdd(platform)}>+</button>
                </div>

                <div className='authorized-accounts-box'>
                    {accounts.map((account, index) => (
                        <div key={index} className='accountbox'>
                            {/* Render account details here if needed */}
                            {platform} Account {index + 1}
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div>
            {renderPlatformBox('Twitter', twitterAccounts, handleAddAccount)}
            {renderPlatformBox('Reddit', redditAccounts, handleAddAccount)}
            {renderPlatformBox('YouTube', youtubeAccounts, handleAddAccount)}
            {renderPlatformBox('TikTok', tiktokAccounts, handleAddAccount)}
        </div>
    );
}

export default AuthorizeAccounts;
