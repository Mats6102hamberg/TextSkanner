import { Request, Response } from 'express';
import Stripe from 'stripe';
import { StripeWebhookEventType } from '../types/stripe';

// Initialize Stripe with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-11-17.clover',
});

/**
 * Webhook endpoint signature
 * This is a raw body endpoint - needs special middleware
 */
export const handleWebhook = async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig) {
    console.error('⚠️ Webhook signature missing');
    return res.status(400).send('Webhook signature missing');
  }

  if (!webhookSecret) {
    console.error('⚠️ STRIPE_WEBHOOK_SECRET not configured');
    return res.status(500).send('Webhook secret not configured');
  }

  let event: Stripe.Event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(
      req.body, // Raw body required
      sig,
      webhookSecret
    );
  } catch (err: any) {
    console.error(`⚠️ Webhook signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log(`✅ Received webhook: ${event.type} [${event.id}]`);

  // Handle different event types
  try {
    switch (event.type) {
      case StripeWebhookEventType.PAYMENT_INTENT_SUCCEEDED:
        await handlePaymentIntentSucceeded(event);
        break;

      case StripeWebhookEventType.PAYMENT_INTENT_FAILED:
        await handlePaymentIntentFailed(event);
        break;

      case StripeWebhookEventType.CHECKOUT_SESSION_COMPLETED:
        await handleCheckoutSessionCompleted(event);
        break;

      case StripeWebhookEventType.CUSTOMER_SUBSCRIPTION_CREATED:
        await handleSubscriptionCreated(event);
        break;

      case StripeWebhookEventType.CUSTOMER_SUBSCRIPTION_UPDATED:
        await handleSubscriptionUpdated(event);
        break;

      case StripeWebhookEventType.CUSTOMER_SUBSCRIPTION_DELETED:
        await handleSubscriptionDeleted(event);
        break;

      case StripeWebhookEventType.INVOICE_PAID:
        await handleInvoicePaid(event);
        break;

      case StripeWebhookEventType.INVOICE_PAYMENT_FAILED:
        await handleInvoicePaymentFailed(event);
        break;

      default:
        console.log(`ℹ️ Unhandled event type: ${event.type}`);
    }

    // Return success response
    res.json({ received: true, eventId: event.id });
  } catch (error: any) {
    console.error(`❌ Error processing webhook ${event.type}:`, error);
    res.status(500).json({
      error: 'Webhook processing failed',
      eventId: event.id
    });
  }
};

/**
 * Handler functions for different event types
 */

async function handlePaymentIntentSucceeded(event: Stripe.Event) {
  const paymentIntent = event.data.object as Stripe.PaymentIntent;

  console.log(`💰 Payment succeeded: ${paymentIntent.id}`);
  console.log(`   Amount: ${paymentIntent.amount / 100} ${paymentIntent.currency.toUpperCase()}`);
  console.log(`   Customer: ${paymentIntent.customer}`);
  console.log(`   Metadata:`, paymentIntent.metadata);

  // TODO: Update database with payment info
  // - Mark order as paid
  // - Send confirmation email
  // - Activate features/services
}

async function handlePaymentIntentFailed(event: Stripe.Event) {
  const paymentIntent = event.data.object as Stripe.PaymentIntent;

  console.log(`❌ Payment failed: ${paymentIntent.id}`);
  console.log(`   Error: ${paymentIntent.last_payment_error?.message}`);

  // TODO: Handle failed payment
  // - Notify customer
  // - Log for analysis
}

async function handleCheckoutSessionCompleted(event: Stripe.Event) {
  const session = event.data.object as Stripe.Checkout.Session;

  console.log(`🛒 Checkout completed: ${session.id}`);
  console.log(`   Customer: ${session.customer}`);
  console.log(`   Email: ${session.customer_email}`);
  console.log(`   Amount: ${session.amount_total ? session.amount_total / 100 : 0} ${session.currency?.toUpperCase()}`);
  console.log(`   Mode: ${session.mode}`);

  // TODO: Process checkout completion
  // - Create user account if needed
  // - Provision subscription
  // - Send welcome email
}

async function handleSubscriptionCreated(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription;

  console.log(`📅 Subscription created: ${subscription.id}`);
  console.log(`   Customer: ${subscription.customer}`);
  console.log(`   Status: ${subscription.status}`);

  // TODO: Handle new subscription
  // - Update user's subscription status
  // - Grant access to premium features
}

async function handleSubscriptionUpdated(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription;

  console.log(`🔄 Subscription updated: ${subscription.id}`);
  console.log(`   Status: ${subscription.status}`);

  // TODO: Handle subscription update
  // - Update tier/plan
  // - Adjust feature access
}

async function handleSubscriptionDeleted(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription;

  console.log(`🗑️ Subscription deleted: ${subscription.id}`);

  // TODO: Handle subscription cancellation
  // - Revoke premium access
  // - Send cancellation email
}

async function handleInvoicePaid(event: Stripe.Event) {
  const invoice = event.data.object as Stripe.Invoice;

  console.log(`📄 Invoice paid: ${invoice.id}`);
  console.log(`   Amount: ${invoice.amount_paid / 100} ${invoice.currency.toUpperCase()}`);

  // TODO: Handle successful invoice payment
  // - Extend subscription period
  // - Send receipt
}

async function handleInvoicePaymentFailed(event: Stripe.Event) {
  const invoice = event.data.object as Stripe.Invoice;

  console.log(`⚠️ Invoice payment failed: ${invoice.id}`);

  // TODO: Handle failed invoice payment
  // - Notify customer
  // - Attempt retry or suspend service
}
