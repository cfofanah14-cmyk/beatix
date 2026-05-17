import { Router } from 'express';
import * as eventsController from '../controllers/events.controller';
import { authenticate, requireRole, optionalAuth } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';

const router = Router();

// GET /api/events — public
router.get('/', optionalAuth, eventsController.listEvents);

// GET /api/events/:id — public
router.get('/:id', optionalAuth, eventsController.getEvent);

// POST /api/events — organizer only
router.post(
  '/',
  authenticate,
  requireRole('organizer', 'admin'),
  validate(eventsController.eventValidation),
  eventsController.createEvent
);

// PUT /api/events/:id — organizer only
router.put(
  '/:id',
  authenticate,
  requireRole('organizer', 'admin'),
  eventsController.updateEvent
);

// DELETE /api/events/:id — organizer only
router.delete(
  '/:id',
  authenticate,
  requireRole('organizer', 'admin'),
  eventsController.deleteEvent
);

// GET /api/events/:id/tiers — public
router.get('/:id/tiers', eventsController.getEventTiers);

// POST /api/events/:id/tiers — organizer only
router.post(
  '/:id/tiers',
  authenticate,
  requireRole('organizer', 'admin'),
  eventsController.createTicketTier
);

export default router;
