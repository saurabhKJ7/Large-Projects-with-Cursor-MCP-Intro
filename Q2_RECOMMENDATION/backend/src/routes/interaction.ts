import { Router } from 'express';
import { authenticateSession } from '../middleware/auth';
import { apiRateLimiter } from '../middleware/rateLimit';
import {
  trackInteraction,
  getUserInteractions,
  getRecentlyViewed,
  getPersonalizedRecommendations,
} from '../controllers/interaction';

const router = Router();

// All routes require authentication
router.use(authenticateSession);

// Track user interactions
router.post('/', apiRateLimiter, trackInteraction);

// Get user's interaction history
router.get('/history', apiRateLimiter, getUserInteractions);

// Get recently viewed products
router.get('/recently-viewed', apiRateLimiter, getRecentlyViewed);

// Get personalized recommendations
router.get('/recommendations', apiRateLimiter, getPersonalizedRecommendations);

export default router;