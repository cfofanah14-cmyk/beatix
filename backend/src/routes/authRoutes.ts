import { Router } from 'express';
import { googleSignIn, register, login, getMe } from '../controllers/authController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.post('/google', googleSignIn);
router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);

export default router;
