import { Request, Response } from 'express';
import { RecommendationEngine } from '../services/recommendationEngine';
import { z } from 'zod';

const RecommendationRequestSchema = z.object({
  limit: z.number().min(1).max(50).default(10),
  timeWindow: z.enum(['day', 'week', 'month']).optional(),
});

export class RecommendationController {
  static async getPersonalizedRecommendations(req: Request, res: Response) {
    try {
      const { limit } = RecommendationRequestSchema.parse(req.query);
      const userId = req.session.userId;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const recommendations = await RecommendationEngine.getHybridRecommendations(
        userId,
        limit
      );

      return res.json(recommendations);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error('Error getting personalized recommendations:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getSimilarProducts(req: Request, res: Response) {
    try {
      const { productId } = req.params;
      const { limit } = RecommendationRequestSchema.parse(req.query);

      if (!productId) {
        return res.status(400).json({ error: 'Product ID is required' });
      }

      const similarProducts = await RecommendationEngine.getSimilarProducts(
        productId,
        limit
      );

      return res.json(similarProducts);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error('Error getting similar products:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getTrendingProducts(req: Request, res: Response) {
    try {
      const { limit, timeWindow } = RecommendationRequestSchema.parse(req.query);

      const trendingProducts = await RecommendationEngine.getTrendingProducts(
        timeWindow || 'week',
        limit
      );

      return res.json(trendingProducts);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error('Error getting trending products:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getColdStartRecommendations(req: Request, res: Response) {
    try {
      const { limit } = RecommendationRequestSchema.parse(req.query);

      const recommendations = await RecommendationEngine.getColdStartRecommendations(
        limit
      );

      return res.json(recommendations);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error('Error getting cold start recommendations:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
}