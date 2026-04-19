import { Router } from 'express'
import { body } from 'express-validator'
import * as OrganizersController from '../controllers/organizersController'
import { authenticate, requireRole } from '../middleware/auth'

const router = Router()

router.post('/apply',          authenticate, [body('org_name').notEmpty()], OrganizersController.applyOrganizer)
router.get('/dashboard',       authenticate, requireRole('organizer','admin'), OrganizersController.getDashboard)
router.get('/events',          authenticate, requireRole('organizer','admin'), OrganizersController.getMyEvents)
router.patch('/profile',       authenticate, requireRole('organizer','admin'), OrganizersController.updateProfile)
router.get('/staff',           authenticate, requireRole('organizer','admin'), OrganizersController.getStaff)
router.post('/staff',          authenticate, requireRole('organizer','admin'), [body('phone').isMobilePhone('any')], OrganizersController.addStaff)
router.delete('/staff/:staffId', authenticate, requireRole('organizer','admin'), OrganizersController.removeStaff)
router.post('/payout',         authenticate, requireRole('organizer','admin'), [body('amount').isFloat({ min: 1 }), body('method').notEmpty()], OrganizersController.requestPayout)

export default router
