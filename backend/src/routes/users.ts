import { Router } from 'express'
import { body } from 'express-validator'
import * as UsersController from '../controllers/usersController'
import { authenticate, optionalAuth } from '../middleware/auth'

const router = Router()

router.patch('/me',                        authenticate, UsersController.updateProfile)
router.get('/wishlist',                    authenticate, UsersController.getWishlist)
router.post('/wishlist/:eventId',          authenticate, UsersController.addToWishlist)
router.delete('/wishlist/:eventId',        authenticate, UsersController.removeFromWishlist)
router.post('/report',                     optionalAuth,  [body('target_type').notEmpty(), body('target_id').notEmpty(), body('reason').notEmpty()], UsersController.submitReport)
router.get('/notifications',               authenticate, UsersController.getNotifications)
router.patch('/notifications/:id/read',    authenticate, UsersController.markNotificationRead)

export default router
