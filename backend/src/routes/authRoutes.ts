import { Router } from 'express';
import { googleSignIn, registerWithPhone, loginWithPhone, getMe } from '../controllers/authController';
import { requireAuth } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimiter';

const router = Router();

router.post('/google', authLimiter, googleSignIn);
router.post('/register', authLimiter, registerWithPhone);
router.post('/login', authLimiter, loginWithPhone);
router.get('/me', requireAuth as any, getMe as any);

export default router;
