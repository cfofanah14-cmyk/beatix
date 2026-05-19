import { Router, RequestHandler } from 'express';
import { purchaseTicket, confirmPayment, webhook, getTicket, scanTicket } from '../controllers/ticketController';
import { requireAuth, requireOrganizer } from '../middleware/auth';

const router = Router();

const auth      = requireAuth      as RequestHandler;
const organizer = requireOrganizer as RequestHandler;

router.post('/webhook',  webhook          as RequestHandler);
router.post('/purchase', auth, purchaseTicket as RequestHandler);
router.post('/confirm',  auth, confirmPayment as RequestHandler);
router.post('/scan',     organizer, scanTicket as RequestHandler);
router.get('/:id',       auth, getTicket      as RequestHandler);

export default router;
