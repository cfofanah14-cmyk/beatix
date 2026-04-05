import { Router } from 'express'
import { body, query as queryVal } from 'express-validator'
import * as EventsController from '../controllers/eventsController'
import { authenticate, requireRole, optionalAuth } from '../middleware/auth'

const router = Router()

// ── Public routes (no auth required) ─────────────────────────────────────────

// GET /api/events — discovery page, public
router.get('/', optionalAuth, EventsController.listEvents)

// GET /api/events/:id — event detail
router.get('/:id', optionalAuth, EventsController.getEvent)

// GET /api/events/:id/ticket-types
router.get('/:id/ticket-types', EventsController.getTicketTypes)

// ── Organizer routes ──────────────────────────────────────────────────────────

// POST /api/events — create event
router.post(
  '/',
  authenticate,
  requireRole('organizer', 'admin'),
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('venue_name').notEmpty(),
    body('starts_at').isISO8601().withMessage('Valid start date required'),
    body('category').notEmpty(),
  ],
  EventsController.createEvent
)

// PUT /api/events/:id — update event
router.put(
  '/:id',
  authenticate,
  requireRole('organizer', 'admin'),
  EventsController.updateEvent
)

// POST /api/events/:id/publish
router.post('/:id/publish', authenticate, requireRole('organizer', 'admin'), EventsController.publishEvent)

// POST /api/events/:id/cancel
router.post('/:id/cancel', authenticate, requireRole('organizer', 'admin'), EventsController.cancelEvent)

// POST /api/events/:id/ticket-types — add ticket type
router.post(
  '/:id/ticket-types',
  authenticate,
  requireRole('organizer', 'admin'),
  [
    body('name').notEmpty(),
    body('price').isFloat({ min: 0 }),
    body('capacity').isInt({ min: 1 }),
  ],
  EventsController.addTicketType
)

// PUT /api/events/:id/ticket-types/:typeId
router.put(
  '/:id/ticket-types/:typeId',
  authenticate,
  requireRole('organizer', 'admin'),
  EventsController.updateTicketType
)

// POST /api/events/:id/discount-codes
router.post(
  '/:id/discount-codes',
  authenticate,
  requireRole('organizer', 'admin'),
  EventsController.createDiscountCode
)

// POST /api/events/:id/boost
router.post('/:id/boost', authenticate, requireRole('organizer', 'admin'), EventsController.boostEvent)

export default router
