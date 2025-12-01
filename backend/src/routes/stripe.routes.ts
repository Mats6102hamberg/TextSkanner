import { Router } from 'express';
import express from 'express';
import { handleWebhook } from '../controllers/stripe.controller';

const router = Router();

/**
 * Stripe webhook endpoint
 *
 * IMPORTANT: This endpoint requires RAW body (not JSON-parsed)
 * for webhook signature verification to work.
 *
 * The raw body middleware is applied only to this specific route.
 */
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  handleWebhook
);

export default router;
