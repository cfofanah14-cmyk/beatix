import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { authLimiter } from '../middleware/rateLimit.middleware';

const router = Router();

// POST /api/auth/register
router.post(
  '/register',
  authLimiter,
  validate(authController.registerValidation),
  authController.register
);

// POST /api/auth/login
router.post(
  '/login',
  authLimiter,
  validate(authController.loginValidation),
  authController.login
);

// POST /api/auth/refresh
router.post('/refresh', authController.refresh);

// POST /api/auth/logout
router.post('/logout', authController.logout);

// GET /api/auth/me
router.get('/me', authenticate, authController.me);

export default router;
