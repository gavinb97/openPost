import React, { useEffect } from 'react';
import Navbar from '../components/Navbar';
import TextConstants from './TextConstants.json';

const MissionStatement = () => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const renderContent = (content) => {
        return (
            <>
                <h3 className="policy-subheading">Our Mission:</h3>
                <p className="policy-text">{content.mission}</p>

                <h3 className="policy-subheading">Our Vision:</h3>
                <p className="policy-text">{content.vision}</p>

                <h3 className="policy-subheading">Our Core Values</h3>
                <h4 className="policy-heading">Inclusivity – We Embrace Diversity:</h4>
                <p className="policy-text">{content.coreValues.inclusivity}</p>

                <h4 className="policy-heading">Security – We Safeguard Our Community:</h4>
                <p className="policy-text">{content.coreValues.security}</p>

                <h4 className="policy-heading">Freedom of Expression – We Encourage Authenticity:</h4>
                <p className="policy-text">{content.coreValues.freedomOfExpression}</p>

                <h4 className="policy-heading">Honesty – We Uphold Integrity:</h4>
                <p className="policy-text">{content.coreValues.honesty}</p>

                <h4 className="policy-heading">Empowerment – We Enable Success:</h4>
                <p className="policy-text">{content.coreValues.empowerment}</p>

                <h4 className="policy-heading">Accountability – We Take Responsibility:</h4>
                <p className="policy-text">{content.coreValues.accountability}</p>
            </>
        );
    };

    const renderHeader = () => {
        return (
            <div className='missionHeader'>
                <h1>Our Mission, Vision And Values</h1>
            </div>
        )
    }

    return (
        <div className='privacy-policy-container'>
            <Navbar />
            <div className='pp-policy-container'>
                
                <div className='pp-policy-container-left'></div>
                <div className='pp-policy-container-right'>
                    <div className='privacy-policy-text-container'>
                    {renderHeader()}
                        {renderContent(TextConstants.missionStatement)}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MissionStatement;
