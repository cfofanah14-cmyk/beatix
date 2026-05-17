import { Router } from 'express';
import {
  listEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  getMyEvents,
} from '../controllers/eventController';
import { requireAuth, requireOrganizer } from '../middleware/auth';

const router = Router();

// Public
router.get('/', listEvents);
router.get('/:id', getEvent);

// Organizer/Admin
router.post('/', requireOrganizer as any, createEvent as any);
router.put('/:id', requireAuth as any, updateEvent as any);
router.delete('/:id', requireAuth as any, deleteEvent as any);
router.get('/organizer/mine', requireOrganizer as any, getMyEvents as any);

export default router;
