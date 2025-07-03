"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecommendationController = void 0;
const recommendationEngine_1 = require("../services/recommendationEngine");
const zod_1 = require("zod");
const RecommendationRequestSchema = zod_1.z.object({
    limit: zod_1.z.number().min(1).max(50).default(10),
    timeWindow: zod_1.z.enum(['day', 'week', 'month']).optional(),
});
class RecommendationController {
    static async getPersonalizedRecommendations(req, res) {
        try {
            const { limit } = RecommendationRequestSchema.parse(req.query);
            const userId = req.session.userId;
            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            const recommendations = await recommendationEngine_1.RecommendationEngine.getHybridRecommendations(userId, limit);
            return res.json(recommendations);
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return res.status(400).json({ error: error.errors });
            }
            console.error('Error getting personalized recommendations:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }
    static async getSimilarProducts(req, res) {
        try {
            const { productId } = req.params;
            const { limit } = RecommendationRequestSchema.parse(req.query);
            if (!productId) {
                return res.status(400).json({ error: 'Product ID is required' });
            }
            const similarProducts = await recommendationEngine_1.RecommendationEngine.getSimilarProducts(productId, limit);
            return res.json(similarProducts);
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return res.status(400).json({ error: error.errors });
            }
            console.error('Error getting similar products:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }
    static async getTrendingProducts(req, res) {
        try {
            const { limit, timeWindow } = RecommendationRequestSchema.parse(req.query);
            const trendingProducts = await recommendationEngine_1.RecommendationEngine.getTrendingProducts(timeWindow || 'week', limit);
            return res.json(trendingProducts);
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return res.status(400).json({ error: error.errors });
            }
            console.error('Error getting trending products:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }
    static async getColdStartRecommendations(req, res) {
        try {
            const { limit } = RecommendationRequestSchema.parse(req.query);
            const recommendations = await recommendationEngine_1.RecommendationEngine.getColdStartRecommendations(limit);
            return res.json(recommendations);
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return res.status(400).json({ error: error.errors });
            }
            console.error('Error getting cold start recommendations:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }
}
exports.RecommendationController = RecommendationController;
//# sourceMappingURL=recommendation.js.map