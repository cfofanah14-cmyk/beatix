import { Router } from 'express';
import {
  initiateTicketPurchase,
  verifyPaymentAndIssueTickets,
  handleWebhook,
  getTicket,
  verifyTicketQR,
} from '../controllers/ticketController';
import { requireAuth, requireOrganizer } from '../middleware/auth';

const router = Router();

// Webhook (no auth — Flutterwave calls this)
router.post('/webhook', handleWebhook);

// Authenticated buyer flows
router.post('/purchase', requireAuth as any, initiateTicketPurchase as any);
router.post('/verify', requireAuth as any, verifyPaymentAndIssueTickets as any);
router.get('/:id', requireAuth as any, getTicket as any);

// Organizer ticket scanning
router.post('/scan', requireOrganizer as any, verifyTicketQR as any);

export default router;
