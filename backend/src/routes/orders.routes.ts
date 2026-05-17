import { Router, raw } from 'express';
import * as ordersController from '../controllers/orders.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';

const router = Router();

// POST /api/orders — authenticated users
router.post('/', authenticate, ordersController.createOrder);

// GET /api/orders/my — authenticated user's orders
router.get('/my', authenticate, ordersController.getMyOrders);

// GET /api/tickets/my — authenticated user's tickets
router.get('/tickets/my', authenticate, ordersController.getMyTickets);

// POST /api/orders/check-in/:qrCode — organizer only
router.post(
  '/check-in/:qrCode',
  authenticate,
  requireRole('organizer', 'admin'),
  ordersController.checkIn
);

// POST /api/orders/webhook/stripe — raw body for Stripe signature verification
router.post(
  '/webhook/stripe',
  raw({ type: 'application/json' }),
  ordersController.stripeWebhook
);

export default router;
