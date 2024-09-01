import React, { useEffect } from "react";
import Navbar from "../components/Navbar";


const Payment = () => {

    useEffect(() => {
        const script = document.createElement("script");
        script.src = "https://js.stripe.com/v3/pricing-table.js";
        script.async = true;
        document.body.appendChild(script);
        return () => {
        document.body.removeChild(script);
        };
        }, []);


    return (
        <div>
            <Navbar></Navbar>
            <div className="payment-page-container">
                <div className="payment-box">

                
                <stripe-pricing-table pricing-table-id="prctbl_1Pu39QB6XZmVBA3csrhIdUnF"
                    publishable-key="pk_live_51Pty8bB6XZmVBA3c44kjhBFzb8mV5nK5PNYPMBFIMyfVi9kzPJsqqyrFLKZ3dOo6gpVCJSoSbjtJuBxSHCeVScvU00eEQMaztp">
                </stripe-pricing-table> 

                </div>
            </div>
        </div>
    )

}

export default Payment