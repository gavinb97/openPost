import React from 'react'
import Navbar from '../components/Navbar'

const PrivacyToS = ({title, body}) => {
    return (
        <div className='privacy-policy-container'>
            <Navbar></Navbar>
            <div className='pp-title-container'>
                <h1>Privacy Policy</h1>
            </div>
            <div className='pp-policy-container'>
                <div className='pp-policy-container-left'>

                </div>
                <div className='pp-policy-container-right'>
                    {/* <p>{body}</p> */}
                </div>
            </div>
            <div className='pp-tos-container'>
                <h1>Terms of Service</h1>
            </div>
            <div className='pp-policy-container'>
                <div className='pp-policy-container-left'>

                </div>
                <div className='pp-policy-container-right'>
                    {/* <p>{body}</p> */}
                </div>
            </div>
        </div>
    )
}

export default PrivacyToS