require('dotenv').config({ path: '../.env' });
const express = require('express');
const router = express.Router();

const bodyParser = require('body-parser');
const { fulfillCheckout, cancelMembership } = require('./authService')
// const stripe = require('stripe')(process.env.STRIPE_SECRET);

// Apply the raw body parser to the Stripe webhook route
router.post('/stripewebhook', bodyParser.raw({ type: '*/*' }), async (request, response) => {
    const stripe = require('stripe')(process.env.STRIPE_SECRET);
    console.log('hitting webhook');
    const sig = request.headers['stripe-signature'];
    const payload = request.body; // This should be a Buffer

    let event;

    try {
        // Use the raw buffer directly for Stripe event construction
        event = stripe.webhooks.constructEvent(request.body, sig, process.env.STRIPE_SECRET);
        console.log('event')
        console.log(event)
    } catch (err) {
        console.error(`Webhook Error: ${err.message}`);
        return response.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
        fulfillCheckout(event.data.object.id);
    } else if (event.type === 'checkout.session.expired' ||
        event.type === 'customer.subscription.deleted' || 
        event.type === 'customer.subscription.paused' ||
        event.type === 'subscription_schedule.aborted' ||
        event.type === 'subscription_schedule.canceled'
    ) {
        console.log('gott cancel the memebershi')
        cancelMembership(event.data.object.id)
    }

    // Respond to acknowledge receipt of the event
    response.status(200).end();
});


 
module.exports = router;