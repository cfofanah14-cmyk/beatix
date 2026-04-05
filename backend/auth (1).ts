import { Router } from 'express'
import { body } from 'express-validator'
import * as AuthController from '../controllers/authController'
import { authLimiter } from '../middleware/rateLimiter'
import { authenticate } from '../middleware/auth'

const router = Router()

// POST /api/auth/send-otp
// Send OTP to phone number (register or login)
router.post(
  '/send-otp',
  authLimiter,
  [body('phone').isMobilePhone('any').withMessage('Invalid phone number')],
  AuthController.sendOtp
)

// POST /api/auth/verify-otp
// Verify OTP and return JWT tokens
router.post(
  '/verify-otp',
  authLimiter,
  [
    body('phone').isMobilePhone('any'),
    body('code').isLength({ min: 6, max: 6 }).isNumeric(),
  ],
  AuthController.verifyOtp
)

// POST /api/auth/refresh
// Refresh access token using refresh token
router.post('/refresh', AuthController.refreshToken)

// POST /api/auth/logout
router.post('/logout', authenticate, AuthController.logout)

// GET /api/auth/me
// Get current authenticated user
router.get('/me', authenticate, AuthController.getMe)

// POST /api/auth/organizer/send-2fa
// Send 2FA code for organizer login
router.post(
  '/organizer/send-2fa',
  authLimiter,
  authenticate,
  AuthController.sendOrganizer2FA
)

// POST /api/auth/organizer/verify-2fa
router.post(
  '/organizer/verify-2fa',
  authLimiter,
  authenticate,
  AuthController.verifyOrganizer2FA
)

export default router
