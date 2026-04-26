import { Router } from 'express';
import { getProfile, updateProfile, getTicketHistory } from '../controllers/profileController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.get('/', protect, getProfile);
router.put('/', protect, updateProfile);
router.get('/tickets', protect, getTicketHistory);

export default router;
