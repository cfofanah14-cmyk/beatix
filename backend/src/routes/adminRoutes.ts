import { Router } from 'express';
import { getAllUsers, getDashboardStats } from '../controllers/adminController';
import { protect, adminOnly } from '../middleware/authMiddleware';

const router = Router();

router.get('/users', protect, adminOnly, getAllUsers);
router.get('/stats', protect, adminOnly, getDashboardStats);

export default router;
