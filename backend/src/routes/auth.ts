import { Router } from 'express'
import { body } from 'express-validator'
import * as AuthController from '../controllers/authController'
import { authLimiter } from '../middleware/rateLimiter'
import { authenticate } from '../middleware/auth'

const router = Router()

router.post('/send-otp',          authLimiter, [body('phone').isMobilePhone('any')], AuthController.sendOtp)
router.post('/verify-otp',        authLimiter, [body('phone').isMobilePhone('any'), body('code').isLength({ min:6, max:6 }).isNumeric()], AuthController.verifyOtp)
router.post('/refresh',           AuthController.refreshToken)
router.post('/logout',            authenticate, AuthController.logout)
router.get('/me',                 authenticate, AuthController.getMe)
router.post('/organizer/send-2fa',   authLimiter, authenticate, AuthController.sendOrganizer2FA)
router.post('/organizer/verify-2fa', authLimiter, authenticate, AuthController.verifyOrganizer2FA)

export default router
