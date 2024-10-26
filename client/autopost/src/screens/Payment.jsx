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
      const email = await fetchUserEmail(user.username, user.jwt);
      setEmail(email);
    };

    getEmail();
    if (user.pro === 'false' || user.pro === false) {
      const script = document.createElement('script');
      script.src = 'https://js.stripe.com/v3/pricing-table.js';
      script.async = true;
      document.body.appendChild(script);
      return () => {
        document.body.removeChild(script);
      };
        
    } else {
      // create portal link just in case
      const getPortalUrl = async () => {
        try {
          const response = await getBillingPortal(user.customerId, user.jwt);
          console.log(response.data);
          return response.data.url;
        } catch (e) {
          console.log(e);
        }
        
      };
      getPortalUrl().then((url) => {
        setPortalUrl(url);
        console.log('url set');
      });
            
    }


  }, []);

  const manageSubscriptionsClick = async () => {
    if (portalUrl) {
      window.location.href = portalUrl;
    }
  };

  return (
    <>
      <div>
        <Navbar></Navbar>
        {email && user && (user.pro === 'false' || user.pro === false) && 
            
            <div className="payment-page-container">
              <div className="payment-box"> 
                <stripe-pricing-table pricing-table-id="prctbl_1Pu39QB6XZmVBA3csrhIdUnF"
                  publishable-key="pk_live_51Pty8bB6XZmVBA3c44kjhBFzb8mV5nK5PNYPMBFIMyfVi9kzPJsqqyrFLKZ3dOo6gpVCJSoSbjtJuBxSHCeVScvU00eEQMaztp"
                  customer-email={email}>
                </stripe-pricing-table>
              </div>
            </div>}

        
    
        {/* {email && user && (user.pro === 'false' || user.pro === false) && 
            <div className="payment-page-container">
              <div className="payment-box"> 
                <stripe-pricing-table pricing-table-id="prctbl_1PuO9FB6XZmVBA3cf3939cnP"
                  publishable-key="pk_test_51Pty8bB6XZmVBA3cmU362FifUiUDRxM4FVWAW4dmlcO1UItmHts9s5mYtHopLzLXohlW1RKLkmupSL1yD7DvmCgR00A8ooiKAk"
                  customer-email={email}>
                </stripe-pricing-table>
              </div>
            </div>} */}


        {email && user && (user.pro === 'true' || user.pro === true)  && 
            
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