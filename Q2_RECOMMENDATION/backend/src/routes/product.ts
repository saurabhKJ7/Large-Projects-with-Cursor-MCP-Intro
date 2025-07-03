import { Router } from 'express';
import { authenticateSession } from '../middleware/auth';
import { apiRateLimiter } from '../middleware/rateLimit';
import {
  getProducts,
  getProductById,
  getSimilarProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../controllers/product';

const router = Router();

// Public routes with rate limiting
router.get('/', apiRateLimiter, getProducts);
router.get('/:id', apiRateLimiter, getProductById);
router.get('/:id/similar', apiRateLimiter, getSimilarProducts);

// Protected routes requiring authentication
router.post('/', authenticateSession, createProduct);
router.put('/:id', authenticateSession, updateProduct);
router.delete('/:id', authenticateSession, deleteProduct);

export default router;