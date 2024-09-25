import React, {useEffect} from 'react';
import { useAuth } from '../service/authContext';
import { getUpdatedDetails } from '../service/userService';
import { useNavigate } from 'react-router-dom';

const ProSuccessScreen = () => {
  const navigate = useNavigate();
  const { user, logoutContext, loginContext  } = useAuth();
    

  // when we get to this page, call the login function
  // so we can get new pro status and customerid for later
  useEffect(() => {
    getUpdatedDetails(user.username, user.jwt).then((details) => {
      loginContext(details);
    }).then(() => {
      setTimeout(() => {
        navigate('/profile');
      }, 2000);
    });
  }, []);


  return (
    <div className="proSuccessContainer">
      <div className="proSuccessScreen">
        <h1>Thank you for supporting OnlyPosts!</h1>
        <br></br>
        <p>Please wait while we redirect you...</p>
        <p>Click <a className='redirectAnchor' href="https://only-posts.com">here</a> if you are not redirected automatically</p>
      </div>

    </div>
  );

};

export default ProSuccessScreen;