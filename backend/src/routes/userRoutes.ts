import { Router, RequestHandler } from 'express';
import { getProfile, updateProfile, changePassword, getMyTickets } from '../controllers/userController';
import { requireAuth } from '../middleware/auth';

const router = Router();

const auth = requireAuth as RequestHandler;

router.get('/profile',         auth, getProfile       as RequestHandler);
router.put('/profile',         auth, updateProfile    as RequestHandler);
router.put('/change-password', auth, changePassword   as RequestHandler);
router.get('/tickets',         auth, getMyTickets     as RequestHandler);

export default router;
