import { Request, Response, NextFunction } from 'express';
import stripeService from '../services/stripe.service';
import paymentsService from '../services/payments.service';
import { AppError } from '../middleware/errorHandler';
import { PaymentStatus } from '@prisma/client';

class WebhooksController {
  async handleStripeWebhook(req: Request, res: Response, next: NextFunction) {
    const signature = req.headers['stripe-signature'];

    if (!signature) {
      return next(new AppError('Missing stripe-signature header', 400));
    }

    try {
      // req.body should be a raw buffer here because of the route configuration
      const event = stripeService.constructEvent(req.body, signature as string);

      switch (event.type) {
        case 'payment_intent.succeeded': {
          const paymentIntent = event.data.object as any;
          // Logic to handle successful payment
          // For now, we might not have a direct link to our internal payment ID if it was initiated externally
          // usually we store metadata in the payment intent
          console.log('Payment Intent Succeeded:', paymentIntent.id);
          // Example:
          // await paymentsService.updateStatusByIntentId(paymentIntent.id, PaymentStatus.posted);
          break;
        }
        case 'payment_intent.payment_failed': {
          const paymentIntent = event.data.object as any;
          console.log('Payment Intent Failed:', paymentIntent.id);
          // Example:
          // await paymentsService.updateStatusByIntentId(paymentIntent.id, PaymentStatus.failed);
          break;
        }
        // Add other event types as needed
        default:
          console.log(`Unhandled event type ${event.type}`);
      }

      // Return a 200 response to acknowledge receipt of the event
      res.status(200).json({ received: true });
    } catch (error: any) {
      console.error('Webhook error:', error.message);
      // Determine if it's a signature verification error or something else
      if (error.type === 'StripeSignatureVerificationError') {
        return next(new AppError(`Webhook Error: ${error.message}`, 400));
      }
      next(error);
    }
  }
}

export default new WebhooksController();
