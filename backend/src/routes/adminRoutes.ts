import { Router, RequestHandler } from 'express';
import {
  getStats, getUserActivity, listUsers, setUserRole,
  listAllEvents, deleteAnyEvent, getFeeSettings, updateFeeSettings,
} from '../controllers/adminController';
import { requireAdmin } from '../middleware/auth';

const router = Router();

const admin = requireAdmin as RequestHandler;

router.get('/stats',          admin, getStats         as RequestHandler);
router.get('/activity',       admin, getUserActivity  as RequestHandler);
router.get('/users',          admin, listUsers        as RequestHandler);
router.put('/users/:id/role', admin, setUserRole      as RequestHandler);
router.get('/events',         admin, listAllEvents    as RequestHandler);
router.delete('/events/:id',  admin, deleteAnyEvent   as RequestHandler);
router.get('/fees',           admin, getFeeSettings   as RequestHandler);
router.put('/fees',           admin, updateFeeSettings as RequestHandler);

export default router;
