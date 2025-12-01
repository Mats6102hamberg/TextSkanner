/**
 * Stripe webhook event types and interfaces
 */

export interface StripeWebhookEvent {
  id: string;
  type: string;
  data: {
    object: any;
  };
  created: number;
  livemode: boolean;
}

export interface PaymentIntentSucceeded {
  id: string;
  amount: number;
  currency: string;
  customer: string | null;
  metadata: Record<string, string>;
  status: string;
}

export interface CheckoutSessionCompleted {
  id: string;
  customer: string | null;
  customer_email: string | null;
  amount_total: number;
  currency: string;
  metadata: Record<string, string>;
  subscription: string | null;
  mode: 'payment' | 'subscription' | 'setup';
}

export interface SubscriptionCreated {
  id: string;
  customer: string;
  status: string;
  current_period_start: number;
  current_period_end: number;
  items: {
    data: Array<{
      id: string;
      price: {
        id: string;
        product: string;
      };
    }>;
  };
}

export interface SubscriptionUpdated extends SubscriptionCreated {}
export interface SubscriptionDeleted extends SubscriptionCreated {}

/**
 * Supported webhook event types
 */
export enum StripeWebhookEventType {
  PAYMENT_INTENT_SUCCEEDED = 'payment_intent.succeeded',
  PAYMENT_INTENT_FAILED = 'payment_intent.payment_failed',
  CHECKOUT_SESSION_COMPLETED = 'checkout.session.completed',
  CUSTOMER_SUBSCRIPTION_CREATED = 'customer.subscription.created',
  CUSTOMER_SUBSCRIPTION_UPDATED = 'customer.subscription.updated',
  CUSTOMER_SUBSCRIPTION_DELETED = 'customer.subscription.deleted',
  INVOICE_PAID = 'invoice.paid',
  INVOICE_PAYMENT_FAILED = 'invoice.payment_failed',
}
