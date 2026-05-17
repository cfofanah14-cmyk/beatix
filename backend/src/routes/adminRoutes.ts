import { Router } from 'express';
import {
  getDashboardStats,
  listUsers,
  updateUserRole,
  listAllEvents,
  adminDeleteEvent,
} from '../controllers/adminController';
import { requireAdmin } from '../middleware/auth';

const router = Router();

// All admin routes require admin role
router.get('/stats', requireAdmin as any, getDashboardStats as any);
router.get('/users', requireAdmin as any, listUsers as any);
router.put('/users/:id/role', requireAdmin as any, updateUserRole as any);
router.get('/events', requireAdmin as any, listAllEvents as any);
router.delete('/events/:id', requireAdmin as any, adminDeleteEvent as any);

export default router;
