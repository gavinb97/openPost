import React, {useEffect, useState} from 'react';
import Navbar from '../components/Navbar';
import { submitContactForm } from '../service/userService';
const ContactSupport = () => {

  useEffect(()=>{
    window.scrollTo(0, 0);
  },[]);

  const [email, setEmail] = useState('');
  const [question, setQuestion] = useState('');

  // Handle changes in the email input
  const handleEmailChange = (event) => {
    setEmail(event.target.value);
  };

  // Handle changes in the question textarea
  const handleQuestionChange = (event) => {
    setQuestion(event.target.value);
  };

  const handleSubmitClick = async () => {
    console.log('attempting to insert');
    try {
      await submitContactForm({email: email, question: question});
      setEmail('');
      setQuestion('');
    } catch (e) {
      console.log('failed to submit contact form');
    }
    
  };

  const renderForm = () => {
    return (
      <div className="contact-container">
                
                
        <div className="contact-form">
          <h1>Contact Support</h1>
          <form>
            <label>
                        Email:
              <br />
              <input type='email' name='email' value={email} 
                onChange={handleEmailChange}  />
            </label>
            <br />
            <br />
            <label>
                        Ask us a question:
              <br />
              <textarea name='question' rows='4' cols='50' value={question} 
                onChange={handleQuestionChange} />
            </label>
            <br />
            <br />
            <button onClick={handleSubmitClick} >Submit</button>
          </form>
        </div>
               
      </div>
    );
  };

  return (
    <div>
      <Navbar></Navbar>
      <div className='constact-support-container'>
        <div className='contact-support-left'></div>
        <div className='contact-support-right'>
          {renderForm()}
        </div>
      </div>
    </div>
  );
};

export default ContactSupport;