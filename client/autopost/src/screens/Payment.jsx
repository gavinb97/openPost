import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";

import { useAuth } from '../service/authContext';

import { fetchUserEmail } from '../service/userService'
const Payment = () => {
    const { user } = useAuth();
    const [email, setEmail] = useState()

    useEffect(() => {
        const getEmail = async () => {
            const email = await fetchUserEmail(user.username)
            setEmail(email)
        }

        getEmail()
        const script = document.createElement("script");
        script.src = "https://js.stripe.com/v3/pricing-table.js";
        script.async = true;
        document.body.appendChild(script);
        return () => {
        document.body.removeChild(script);
        };
        }, []);

        return (
        <>
        {email &&<div>
            <Navbar></Navbar>
            <div className="payment-page-container">
                <div className="payment-box">

                
                {/* <stripe-pricing-table pricing-table-id="prctbl_1Pu39QB6XZmVBA3csrhIdUnF"
                    publishable-key="pk_live_51Pty8bB6XZmVBA3c44kjhBFzb8mV5nK5PNYPMBFIMyfVi9kzPJsqqyrFLKZ3dOo6gpVCJSoSbjtJuBxSHCeVScvU00eEQMaztp">
                </stripe-pricing-table>  */}

        <stripe-pricing-table pricing-table-id="prctbl_1PuO9FB6XZmVBA3cf3939cnP"
            publishable-key="pk_test_51Pty8bB6XZmVBA3cmU362FifUiUDRxM4FVWAW4dmlcO1UItmHts9s5mYtHopLzLXohlW1RKLkmupSL1yD7DvmCgR00A8ooiKAk"
            customer-email={email}>
        </stripe-pricing-table>

                </div>
            </div>
        </div>}
        </>
    )

}

export default Payment