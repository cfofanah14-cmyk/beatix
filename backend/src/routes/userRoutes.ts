import { Router } from 'express';
import { getProfile, updateProfile, changePassword, getMyTickets } from '../controllers/userController';
import { requireAuth } from '../middleware/auth';

const router = Router();

// All user routes require authentication
router.get('/profile', requireAuth as any, getProfile as any);
router.put('/profile', requireAuth as any, updateProfile as any);
router.put('/change-password', requireAuth as any, changePassword as any);
router.get('/tickets', requireAuth as any, getMyTickets as any);

export default router;
