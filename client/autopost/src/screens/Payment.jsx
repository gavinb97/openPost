import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { getBillingPortal } from '../service/userService';

import { useAuth } from '../service/authContext';

import { fetchUserEmail } from '../service/userService';
const Payment = () => {
  const { user } = useAuth();
  const [email, setEmail] = useState();

  const [portalUrl, setPortalUrl] = useState();

  useEffect(() => {
    const getEmail = async () => {
      const email = await fetchUserEmail(user.username);
      setEmail(email);
    };

    getEmail();
    if (user.pro === 'false') {
      console.log('user is not pro')
      const script = document.createElement('script');
      script.src = 'https://js.stripe.com/v3/pricing-table.js';
      script.async = true;
      document.body.appendChild(script);
      return () => {
        document.body.removeChild(script);
      };
        
    } else {
      console.log('user is pro')
      console.log(user)
      console.log(user.pro)
      // create portal link just in case
      const getPortalUrl = async () => {
        const response = await getBillingPortal(user.customerId);
        return response.data.url;
      };
      getPortalUrl().then((url) => {
        setPortalUrl(url);
        console.log('portal url set')
      });
            
    }


  }, []);

  const manageSubscriptionsClick = async () => {
    console.log('clicked');
    if (portalUrl) {
      window.location.href = portalUrl;
    }
  };

  return (
    <>
      <div>
        <Navbar></Navbar>
        {email && user && user.pro === 'false' && 
            
            <div className="payment-page-container">
              <div className="payment-box"> 
                <stripe-pricing-table pricing-table-id="prctbl_1PuO9FB6XZmVBA3cf3939cnP"
                  publishable-key="pk_test_51Pty8bB6XZmVBA3cmU362FifUiUDRxM4FVWAW4dmlcO1UItmHts9s5mYtHopLzLXohlW1RKLkmupSL1yD7DvmCgR00A8ooiKAk"
                  customer-email={email}>
                </stripe-pricing-table>
              </div>
            </div>}


        {email && user && user.pro === 'true'  && 
            
            <div className="payment-page-container">
              <div className="youHavePremium">
                <h1>You are premium</h1>
                <button onClick={manageSubscriptionsClick}>Manage Subscription</button>
              </div>
            </div>   
        }

      </div>
        
        
    </>
  );

};

export default Payment;