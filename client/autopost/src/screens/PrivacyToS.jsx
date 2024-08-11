import React, { useEffect } from 'react';
import Navbar from '../components/Navbar';
import TextConstants from './TextConstants.json';

const PrivacyToS = () => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const renderContent = (content) => {
        return content.split('\n').map((line, index) => {
            if (line.startsWith("1.") || line.startsWith("2.") || line.startsWith("3.") || line.startsWith("4.") || 
                line.startsWith("5.") || line.startsWith("6.") || line.startsWith("7.") || line.startsWith("8.") || 
                line.startsWith("9.") || line.startsWith("10.") || line.startsWith("11.")) {
                return <h2 key={index} className="policy-heading">{line}</h2>;
            } else if (line.startsWith("Privacy Policy") || line.startsWith("Effective Date:") || 
                       line.startsWith("Terms of Service") || line.startsWith("Effective Date:")) {
                return <h3 key={index} className="policy-subheading">{line}</h3>;
            } else {
                return <p key={index} className="policy-text">{line}</p>;
            }
        });
    };

    return (
        <div className='privacy-policy-container'>
            <Navbar />
           
            <div className='pp-policy-container'>
                <div className='pp-policy-container-left'></div>
                <div className='pp-policy-container-right'>
                    <div className='privacy-policy-text-container'>
                        {renderContent(TextConstants.privacyPolicy)}
                    </div>
                </div>
            </div>
            
            <div className='pp-policy-container2'>
                <div className='pp-policy-container-left'></div>
                <div className='pp-policy-container-right'>
                    <div className='privacy-policy-text-container'>
                        {renderContent(TextConstants.ToS)}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PrivacyToS;