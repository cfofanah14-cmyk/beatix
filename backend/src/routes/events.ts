import { Router } from 'express'
import { body } from 'express-validator'
import * as EventsController from '../controllers/eventsController'
import { authenticate, requireRole, optionalAuth } from '../middleware/auth'

const router = Router()

// Public
router.get('/',                  optionalAuth, EventsController.listEvents)
router.get('/:id',               optionalAuth, EventsController.getEvent)
router.get('/:id/ticket-types',              EventsController.getTicketTypes)

// Organizer only
router.post('/',                 authenticate, requireRole('organizer','admin'), [body('title').notEmpty(), body('venue_name').notEmpty(), body('starts_at').isISO8601(), body('category').notEmpty()], EventsController.createEvent)
router.put('/:id',               authenticate, requireRole('organizer','admin'), EventsController.updateEvent)
router.post('/:id/publish',      authenticate, requireRole('organizer','admin'), EventsController.publishEvent)
router.post('/:id/cancel',       authenticate, requireRole('organizer','admin'), EventsController.cancelEvent)
router.post('/:id/ticket-types', authenticate, requireRole('organizer','admin'), EventsController.addTicketType)
router.put('/:id/ticket-types/:typeId', authenticate, requireRole('organizer','admin'), EventsController.updateTicketType)
router.post('/:id/discount-codes', authenticate, requireRole('organizer','admin'), EventsController.createDiscountCode)
router.post('/:id/boost',        authenticate, requireRole('organizer','admin'), EventsController.boostEvent)

export default router
