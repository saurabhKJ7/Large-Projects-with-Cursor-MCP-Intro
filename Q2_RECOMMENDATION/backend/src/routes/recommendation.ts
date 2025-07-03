import express from 'express';
import { RecommendationController } from '../controllers/recommendation';
import { authenticateSession } from '../middleware/auth';
import { apiRateLimiter } from '../middleware/rateLimit';

const router = express.Router();

// Apply rate limiting to all recommendation routes
router.use(apiRateLimiter);

// Personalized recommendations (requires authentication)
router.get(
  '/personalized',
  authenticateSession,
  RecommendationController.getPersonalizedRecommendations
);

// Similar products
router.get(
  '/similar/:productId',
  RecommendationController.getSimilarProducts
);

// Trending products
router.get(
  '/trending',
  RecommendationController.getTrendingProducts
);

// Cold start recommendations for new users
router.get(
  '/cold-start',
  RecommendationController.getColdStartRecommendations
);

export default router;