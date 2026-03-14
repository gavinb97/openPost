// ============================================================
// Billing Routes — Stripe subscription management
// ============================================================

import { Router, raw } from 'express';
import Stripe from 'stripe';
import { config } from '../config';
import { query, queryOne } from '../db';
import { requireAuth } from '../middleware/auth';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import type { User } from '@onlyposts/shared';

export const billingRouter = Router();

const stripe = new Stripe(config.stripe.secret, { apiVersion: '2024-06-20' as any });

// ---------- Create checkout session ----------

billingRouter.post('/checkout', requireAuth, asyncHandler(async (req, res) => {
  const user = await queryOne<User>(
    'SELECT * FROM users WHERE id = $1',
    [req.user!.userId],
  );
  if (!user) throw new AppError(404, 'User not found');

  // Create or retrieve Stripe customer
  let customerId = user.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { userId: user.id },
    });
    customerId = customer.id;
    await query('UPDATE users SET stripe_customer_id = $1 WHERE id = $2', [customerId, user.id]);
  }

  // Create checkout session for Pro plan
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'OnlyPosts Pro',
            description: 'Unlimited agents, priority support, advanced analytics',
          },
          unit_amount: 2999, // $29.99
          recurring: { interval: 'month' },
        },
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: `${config.frontendUrl}/dashboard/billing?success=true`,
    cancel_url: `${config.frontendUrl}/dashboard/billing?cancelled=true`,
  });

  res.json({ ok: true, data: { url: session.url } });
}));

// ---------- Customer portal ----------

billingRouter.post('/portal', requireAuth, asyncHandler(async (req, res) => {
  const user = await queryOne<User>(
    'SELECT stripe_customer_id FROM users WHERE id = $1',
    [req.user!.userId],
  );
  if (!user?.stripe_customer_id) throw new AppError(400, 'No billing account found');

  const session = await stripe.billingPortal.sessions.create({
    customer: user.stripe_customer_id,
    return_url: `${config.frontendUrl}/dashboard/billing`,
  });

  res.json({ ok: true, data: { url: session.url } });
}));

// ---------- Get subscription status ----------

billingRouter.get('/status', requireAuth, asyncHandler(async (req, res) => {
  const user = await queryOne<User>(
    'SELECT pro, stripe_customer_id, stripe_subscription_id FROM users WHERE id = $1',
    [req.user!.userId],
  );

  res.json({
    ok: true,
    data: {
      pro: user?.pro || false,
      has_billing: !!user?.stripe_customer_id,
      subscription_id: user?.stripe_subscription_id || null,
    },
  });
}));

// ---------- Stripe Webhook ----------

billingRouter.post('/webhook', raw({ type: 'application/json' }), asyncHandler(async (req, res) => {
  const sig = req.headers['stripe-signature'] as string;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, config.stripe.webhookSecret);
  } catch (err: any) {
    console.error('[Stripe] Webhook signature verification failed:', err.message);
    res.status(400).json({ ok: false, error: 'Invalid signature' });
    return;
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.customer) {
        await query(
          `UPDATE users SET pro = true, stripe_subscription_id = $1
           WHERE stripe_customer_id = $2`,
          [session.subscription, session.customer],
        );
        console.log(`[Stripe] User upgraded to Pro: ${session.customer}`);
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      await query(
        `UPDATE users SET pro = false, stripe_subscription_id = NULL
         WHERE stripe_customer_id = $1`,
        [subscription.customer],
      );
      console.log(`[Stripe] User downgraded: ${subscription.customer}`);
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      console.warn(`[Stripe] Payment failed for: ${invoice.customer}`);
      break;
    }
  }

  res.json({ ok: true, received: true });
}));
