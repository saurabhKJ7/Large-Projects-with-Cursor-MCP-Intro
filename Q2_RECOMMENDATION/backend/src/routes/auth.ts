import { Router } from 'express';
import {
  register,
  login,
  getProfile,
  updateProfile,
  requestPasswordReset,
  resetPassword,
} from '../controllers/auth';
import { authenticateSession } from '../middleware/auth';
import { authRateLimiter } from '../middleware/rateLimit';

const router = Router();

// Public routes
router.post('/register', authRateLimiter, register);
router.post('/login', authRateLimiter, login);
router.post('/password-reset-request', authRateLimiter, requestPasswordReset);
router.post('/password-reset', authRateLimiter, resetPassword);

// Protected routes
router.get('/me', authenticateSession, getProfile);
router.patch('/profile', authenticateSession, updateProfile);

export { router as authRouter };