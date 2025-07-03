"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InteractionService = void 0;
const client_1 = require("@prisma/client");
const interaction_1 = require("../types/interaction");
const prisma = new client_1.PrismaClient();
class InteractionService {
    static async getCategoryMap() {
        const products = await prisma.product.findMany({
            select: { id: true, category: true, subcategory: true },
        });
        return products.reduce((map, product) => {
            map[product.id] = product.category;
            return map;
        }, {});
    }
    static async trackInteraction(userId, productId, type) {
        return prisma.interaction.create({
            data: {
                userId,
                productId,
                type: type
            },
        });
    }
    static async getUserInteractionStats(userId) {
        const [viewCount, likeCount, purchaseCount, recentViews, likes, purchases,] = await Promise.all([
            prisma.interaction.count({
                where: { userId, type: 'view' },
            }),
            prisma.interaction.count({
                where: { userId, type: 'like' },
            }),
            prisma.interaction.count({
                where: { userId, type: 'purchase' },
            }),
            prisma.interaction.findMany({
                where: { userId, type: 'view' },
                orderBy: { createdAt: 'desc' },
                take: 10,
                select: { productId: true },
            }),
            prisma.interaction.findMany({
                where: { userId, type: 'like' },
                select: { productId: true },
            }),
            prisma.interaction.findMany({
                where: { userId, type: 'purchase' },
                select: { productId: true },
            }),
        ]);
        return {
            totalViews: viewCount,
            totalLikes: likeCount,
            totalPurchases: purchaseCount,
            recentlyViewed: recentViews.map((i) => i.productId),
            likedProducts: likes.map((i) => i.productId),
            purchasedProducts: purchases.map((i) => i.productId),
        };
    }
    static async updateUserPreferences(userId) {
        const interactions = await prisma.interaction.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 100,
            select: {
                id: true,
                type: true,
                userId: true,
                productId: true,
                createdAt: true
            }
        });
        const categoryMap = await this.getCategoryMap();
        const preferences = (0, interaction_1.calculateCategoryPreference)(interactions, categoryMap);
        await Promise.all(Object.entries(preferences).map(([category, weight]) => prisma.userPreference.upsert({
            where: {
                userId_category: {
                    userId,
                    category,
                },
            },
            update: { weight },
            create: {
                userId,
                category,
                weight,
            },
        })));
        return preferences;
    }
    static async getPersonalizedRecommendations(userId, limit = 10) {
        const preferences = await prisma.userPreference.findMany({
            where: { userId },
        });
        const products = await prisma.product.findMany();
        const scores = products.map((product) => {
            let score = 0;
            const categoryPreference = preferences.find((p) => p.category === product.category);
            if (categoryPreference) {
                score += categoryPreference.weight * 0.4;
            }
            score += (product.rating / 5) * 0.3;
            if (product.isFeatured) {
                score += 0.2;
            }
            if (product.isOnSale) {
                score += 0.1;
            }
            return {
                product,
                score,
            };
        });
        return scores
            .sort((a, b) => b.score - a.score)
            .slice(0, limit)
            .map((item) => {
            var _a;
            return ({
                id: item.product.id,
                createdAt: item.product.createdAt,
                updatedAt: item.product.updatedAt,
                description: item.product.description,
                productName: item.product.productName,
                productId: item.product.productId,
                category: item.product.category,
                subcategory: item.product.subcategory,
                price: item.product.price,
                quantityInStock: item.product.quantityInStock,
                manufacturer: item.product.manufacturer,
                rating: item.product.rating,
                isFeatured: item.product.isFeatured,
                isOnSale: item.product.isOnSale,
                salePrice: (_a = item.product.salePrice) !== null && _a !== void 0 ? _a : undefined,
                features: item.product.features,
                similarityVector: item.product.similarityVector,
                weight: item.product.weight,
                dimensions: item.product.dimensions,
                releaseDate: new Date(item.product.releaseDate),
                imageUrl: item.product.imageUrl
            });
        });
    }
    static async getRecentlyViewedProducts(userId, limit = 5) {
        const recentViews = await prisma.interaction.findMany({
            where: { userId, type: 'view' },
            orderBy: { createdAt: 'desc' },
            take: limit,
            include: { product: true },
            distinct: ['productId'],
        });
        return recentViews.map((view) => {
            var _a;
            return ({
                id: view.product.id,
                createdAt: view.product.createdAt,
                updatedAt: view.product.updatedAt,
                description: view.product.description,
                productName: view.product.productName,
                productId: view.product.productId,
                category: view.product.category,
                subcategory: view.product.subcategory,
                price: view.product.price,
                quantityInStock: view.product.quantityInStock,
                manufacturer: view.product.manufacturer,
                rating: view.product.rating,
                isFeatured: view.product.isFeatured,
                isOnSale: view.product.isOnSale,
                salePrice: (_a = view.product.salePrice) !== null && _a !== void 0 ? _a : undefined,
                features: view.product.features,
                similarityVector: view.product.similarityVector,
                weight: view.product.weight,
                dimensions: view.product.dimensions,
                releaseDate: new Date(view.product.releaseDate),
                imageUrl: view.product.imageUrl
            });
        });
    }
}
exports.InteractionService = InteractionService;
//# sourceMappingURL=interactionService.js.map