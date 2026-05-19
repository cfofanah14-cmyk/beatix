import { Router, RequestHandler } from 'express';
import { googleSignIn, register, login, getMe } from '../controllers/authController';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.post('/google',   googleSignIn as RequestHandler);
router.post('/register', register     as RequestHandler);
router.post('/login',    login        as RequestHandler);
router.get('/me',        requireAuth  as RequestHandler, getMe as RequestHandler);

export default router;
