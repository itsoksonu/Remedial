import Stripe from 'stripe';
import { env } from '../config/env';

// Initialize Stripe with the secret key
const stripe = new Stripe(env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16', // Use a pinned version or latest supported
});

class StripeService {
  /**
   * Construct a Stripe event from the raw body and signature.
   * This is crucial for verifying that the request came from Stripe.
   */
  constructEvent(payload: string | Buffer, signature: string): Stripe.Event {
    if (!env.STRIPE_WEBHOOK_SECRET) {
      throw new Error('STRIPE_WEBHOOK_SECRET is not defined in environment variables');
    }
    return stripe.webhooks.constructEvent(payload, signature, env.STRIPE_WEBHOOK_SECRET);
  }

  /**
   * Get the Stripe client instance if needed for other operations
   */
  getClient(): Stripe {
    return stripe;
  }
}

export default new StripeService();
