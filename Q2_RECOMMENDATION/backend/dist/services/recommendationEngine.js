"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecommendationEngine = void 0;
const client_1 = require("@prisma/client");
const cacheService_1 = require("./cacheService");
const logger_1 = require("../utils/logger");
const prisma = new client_1.PrismaClient();
const cacheService = new cacheService_1.CacheService();
const parseVector = (vectorString) => {
    try {
        return JSON.parse(vectorString);
    }
    catch (_a) {
        return [];
    }
};
const calculateCosineSimilarity = (vector1String, vector2String) => {
    const vector1 = parseVector(vector1String);
    const vector2 = parseVector(vector2String);
    if (vector1.length !== vector2.length || vector1.length === 0) {
        return 0;
    }
    const dotProduct = vector1.reduce((sum, val, i) => sum + val * vector2[i], 0);
    const magnitude1 = Math.sqrt(vector1.reduce((sum, val) => sum + val * val, 0));
    const magnitude2 = Math.sqrt(vector2.reduce((sum, val) => sum + val * val, 0));
    if (magnitude1 === 0 || magnitude2 === 0) {
        return 0;
    }
    return dotProduct / (magnitude1 * magnitude2);
};
class RecommendationEngine {
    static async getUserItemMatrix() {
        const interactions = await prisma.interaction.findMany({
            include: { product: true },
        });
        const userIndices = [...new Set(interactions.map(i => i.userId))];
        const productIndices = [...new Set(interactions.map(i => i.productId))];
        const matrix = {};
        userIndices.forEach(userId => {
            matrix[userId] = {};
            productIndices.forEach(productId => {
                matrix[userId][productId] = 0;
            });
        });
        interactions.forEach(interaction => {
            const weight = this.getInteractionWeight(interaction.type);
            matrix[interaction.userId][interaction.productId] += weight;
        });
        return { matrix, userIndices, productIndices };
    }
    static getInteractionWeight(type) {
        switch (type) {
            case 'purchase': return 1.0;
            case 'like': return 0.5;
            case 'view': return 0.2;
            case 'search': return 0.1;
            case 'addToCart': return 0.4;
            case 'removeFromCart': return -0.2;
            default: return 0.1;
        }
    }
    static async calculateUserSimilarity(userId1, userId2, matrix) {
        const user1Vector = Object.values(matrix[userId1]);
        const user2Vector = Object.values(matrix[userId2]);
        return calculateCosineSimilarity(JSON.stringify(user1Vector), JSON.stringify(user2Vector));
    }
    static async getCollaborativeRecommendations(userId, limit) {
        const cached = await cacheService.getPersonalizedRecommendations(userId);
        if (cached)
            return cached;
        const { matrix, userIndices, productIndices } = await this.getUserItemMatrix();
        if (!matrix[userId]) {
            return [];
        }
        const userSimilarities = [];
        for (const otherUserId of userIndices) {
            if (otherUserId === userId)
                continue;
            const similarity = await this.calculateUserSimilarity(userId, otherUserId, matrix);
            userSimilarities.push({ userId: otherUserId, similarity });
        }
        const topSimilarUsers = userSimilarities
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, 10);
        const predictions = [];
        for (const productId of productIndices) {
            if (matrix[userId][productId] > 0)
                continue;
            let weightedSum = 0;
            let similaritySum = 0;
            for (const { userId: similarUserId, similarity } of topSimilarUsers) {
                weightedSum += similarity * matrix[similarUserId][productId];
                similaritySum += similarity;
            }
            const predictedScore = similaritySum > 0 ? weightedSum / similaritySum : 0;
            predictions.push({ productId, score: predictedScore });
        }
        const topPredictions = predictions
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);
        const products = await prisma.product.findMany({
            where: {
                id: { in: topPredictions.map(p => p.productId) }
            }
        });
        const productsWithDetails = products.map(product => {
            var _a;
            return ({
                id: product.id,
                createdAt: product.createdAt,
                updatedAt: product.updatedAt,
                description: product.description,
                productName: product.productName,
                productId: product.productId,
                category: product.category,
                subcategory: product.subcategory,
                price: product.price,
                quantityInStock: product.quantityInStock,
                manufacturer: product.manufacturer,
                rating: product.rating,
                isFeatured: product.isFeatured,
                isOnSale: product.isOnSale,
                salePrice: (_a = product.salePrice) !== null && _a !== void 0 ? _a : undefined,
                features: product.features,
                similarityVector: product.similarityVector,
                weight: product.weight,
                dimensions: product.dimensions,
                releaseDate: new Date(product.releaseDate),
                imageUrl: product.imageUrl
            });
        });
        await cacheService.setPersonalizedRecommendations(userId, productsWithDetails);
        return productsWithDetails;
    }
    static async getContentBasedRecommendations(userId, limit) {
        const cached = await cacheService.getPersonalizedRecommendations(userId);
        if (cached)
            return cached;
        const interactions = await prisma.interaction.findMany({
            where: { userId },
            include: { product: true },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
        if (interactions.length === 0) {
            return [];
        }
        const userProfile = interactions.reduce((acc, interaction) => {
            const weight = this.getInteractionWeight(interaction.type);
            const vector = parseVector(interaction.product.similarityVector);
            return acc.map((val, idx) => val + (vector[idx] || 0) * weight);
        }, new Array(parseVector(interactions[0].product.similarityVector).length).fill(0));
        const userProfileString = JSON.stringify(userProfile);
        const allProducts = await prisma.product.findMany({
            select: {
                id: true,
                createdAt: true,
                updatedAt: true,
                productId: true,
                productName: true,
                category: true,
                subcategory: true,
                price: true,
                quantityInStock: true,
                manufacturer: true,
                description: true,
                weight: true,
                dimensions: true,
                releaseDate: true,
                rating: true,
                isFeatured: true,
                isOnSale: true,
                salePrice: true,
                imageUrl: true,
                features: true,
                similarityVector: true,
            },
        });
        const similarities = allProducts
            .filter(product => !interactions.some(i => i.productId === product.id))
            .map(product => ({
            productId: product.id,
            score: calculateCosineSimilarity(userProfileString, product.similarityVector)
        }))
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);
        const recommendedProducts = await prisma.product.findMany({
            where: {
                id: { in: similarities.map(s => s.productId) }
            }
        });
        const productsWithDetails = recommendedProducts.map(product => {
            var _a;
            return ({
                id: product.id,
                createdAt: product.createdAt,
                updatedAt: product.updatedAt,
                description: product.description,
                productName: product.productName,
                productId: product.productId,
                category: product.category,
                subcategory: product.subcategory,
                price: product.price,
                quantityInStock: product.quantityInStock,
                manufacturer: product.manufacturer,
                rating: product.rating,
                isFeatured: product.isFeatured,
                isOnSale: product.isOnSale,
                salePrice: (_a = product.salePrice) !== null && _a !== void 0 ? _a : undefined,
                features: product.features,
                similarityVector: product.similarityVector,
                weight: product.weight,
                dimensions: product.dimensions,
                releaseDate: new Date(product.releaseDate),
                imageUrl: product.imageUrl
            });
        });
        await cacheService.setPersonalizedRecommendations(userId, productsWithDetails);
        return productsWithDetails;
    }
    static async getHybridRecommendations(userId, limit = 10) {
        try {
            const cachedRecommendations = await cacheService.getPersonalizedRecommendations(userId);
            if (cachedRecommendations) {
                logger_1.logger.debug(`Cache hit for user ${userId}'s personalized recommendations`);
                return cachedRecommendations;
            }
            const [collaborative, contentBased] = await Promise.all([
                this.getCollaborativeRecommendations(userId, limit * 2),
                this.getContentBasedRecommendations(userId, limit * 2),
            ]);
            const combinedScores = new Map();
            collaborative.forEach((product) => {
                combinedScores.set(product.id, (product.rating / 5) * this.COLLABORATIVE_WEIGHT);
            });
            contentBased.forEach((product) => {
                const existingScore = combinedScores.get(product.id) || 0;
                combinedScores.set(product.id, existingScore + (product.rating / 5) * this.CONTENT_WEIGHT);
            });
            const products = await prisma.product.findMany({
                where: {
                    id: { in: Array.from(combinedScores.keys()) },
                },
            });
            const result = products
                .map(product => {
                var _a;
                return ({
                    id: product.id,
                    createdAt: product.createdAt,
                    updatedAt: product.updatedAt,
                    description: product.description,
                    productName: product.productName,
                    productId: product.productId,
                    category: product.category,
                    subcategory: product.subcategory,
                    price: product.price,
                    quantityInStock: product.quantityInStock,
                    manufacturer: product.manufacturer,
                    rating: product.rating,
                    isFeatured: product.isFeatured,
                    isOnSale: product.isOnSale,
                    salePrice: (_a = product.salePrice) !== null && _a !== void 0 ? _a : undefined,
                    features: product.features,
                    similarityVector: product.similarityVector,
                    weight: product.weight,
                    dimensions: product.dimensions,
                    releaseDate: new Date(product.releaseDate),
                    imageUrl: product.imageUrl,
                    score: combinedScores.get(product.id) || 0
                });
            })
                .sort((a, b) => (b.score || 0) - (a.score || 0))
                .slice(0, limit);
            await cacheService.setPersonalizedRecommendations(userId, result);
            return result;
        }
        catch (error) {
            logger_1.logger.error('Error in getHybridRecommendations:', error);
            throw error;
        }
    }
    static async getColdStartRecommendations(limit = 10) {
        const cacheKey = `cold_start_${limit}`;
        const cached = await cacheService.getPersonalizedRecommendations(cacheKey);
        if (cached)
            return cached;
        const products = await prisma.product.findMany({
            where: {
                rating: { gte: 4 },
                isFeatured: true,
            },
            select: {
                id: true,
                createdAt: true,
                updatedAt: true,
                productId: true,
                productName: true,
                category: true,
                subcategory: true,
                price: true,
                quantityInStock: true,
                manufacturer: true,
                description: true,
                weight: true,
                dimensions: true,
                releaseDate: true,
                rating: true,
                isFeatured: true,
                isOnSale: true,
                salePrice: true,
                imageUrl: true,
                features: true,
                similarityVector: true,
            },
            orderBy: [
                { rating: 'desc' },
                { createdAt: 'desc' },
            ],
            take: limit,
        });
        const formattedProducts = products.map(product => {
            var _a;
            return ({
                id: product.id,
                createdAt: product.createdAt,
                updatedAt: product.updatedAt,
                description: product.description,
                productName: product.productName,
                productId: product.productId,
                category: product.category,
                subcategory: product.subcategory,
                price: product.price,
                quantityInStock: product.quantityInStock,
                manufacturer: product.manufacturer,
                rating: product.rating,
                isFeatured: product.isFeatured,
                isOnSale: product.isOnSale,
                salePrice: (_a = product.salePrice) !== null && _a !== void 0 ? _a : undefined,
                features: product.features,
                similarityVector: product.similarityVector,
                weight: product.weight,
                dimensions: product.dimensions,
                releaseDate: new Date(product.releaseDate),
                imageUrl: product.imageUrl
            });
        });
        await cacheService.setPersonalizedRecommendations(cacheKey, formattedProducts);
        return formattedProducts;
    }
    static async getSimilarProducts(productId, limit = 5) {
        try {
            const cachedSimilarProducts = await cacheService.getSimilarProducts(productId);
            if (cachedSimilarProducts) {
                logger_1.logger.debug(`Cache hit for product ${productId}'s similar products`);
                return cachedSimilarProducts;
            }
            const sourceProduct = await prisma.product.findUnique({
                where: { id: productId },
            });
            if (!sourceProduct) {
                throw new Error('Product not found');
            }
            const products = await prisma.product.findMany({
                where: {
                    AND: [
                        { id: { not: productId } },
                        { category: sourceProduct.category },
                    ],
                },
            });
            const result = products
                .map(product => {
                var _a;
                return ({
                    id: product.id,
                    createdAt: product.createdAt,
                    updatedAt: product.updatedAt,
                    description: product.description,
                    productName: product.productName,
                    productId: product.productId,
                    category: product.category,
                    subcategory: product.subcategory,
                    price: product.price,
                    quantityInStock: product.quantityInStock,
                    manufacturer: product.manufacturer,
                    rating: product.rating,
                    isFeatured: product.isFeatured,
                    isOnSale: product.isOnSale,
                    salePrice: (_a = product.salePrice) !== null && _a !== void 0 ? _a : undefined,
                    features: product.features,
                    similarityVector: product.similarityVector,
                    weight: product.weight,
                    dimensions: product.dimensions,
                    releaseDate: new Date(product.releaseDate),
                    imageUrl: product.imageUrl,
                    similarity: calculateCosineSimilarity(sourceProduct.similarityVector, product.similarityVector)
                });
            })
                .sort((a, b) => (b.similarity || 0) - (a.similarity || 0))
                .slice(0, limit);
            await cacheService.setSimilarProducts(productId, result);
            return result;
        }
        catch (error) {
            logger_1.logger.error('Error in getSimilarProducts:', error);
            throw error;
        }
    }
    static async getTrendingProducts(timeWindow = 'week', limit = 10) {
        try {
            const cachedTrending = await cacheService.getTrendingProducts(timeWindow);
            if (cachedTrending) {
                logger_1.logger.debug(`Cache hit for trending products (${timeWindow})`);
                return cachedTrending;
            }
            const timeFilter = new Date();
            switch (timeWindow) {
                case 'day':
                    timeFilter.setDate(timeFilter.getDate() - 1);
                    break;
                case 'week':
                    timeFilter.setDate(timeFilter.getDate() - 7);
                    break;
                case 'month':
                    timeFilter.setMonth(timeFilter.getMonth() - 1);
                    break;
            }
            const interactions = await prisma.interaction.findMany({
                where: {
                    createdAt: { gte: timeFilter },
                    type: { in: ['view', 'like', 'purchase'] },
                },
                include: { product: true },
            });
            const productCounts = new Map();
            interactions.forEach(interaction => {
                const count = productCounts.get(interaction.productId) || 0;
                productCounts.set(interaction.productId, count + this.getInteractionWeight(interaction.type));
            });
            const products = await prisma.product.findMany({
                where: {
                    id: { in: Array.from(productCounts.keys()) },
                },
            });
            const result = products
                .map(product => {
                var _a;
                return (Object.assign(Object.assign({}, product), { interactionCount: productCounts.get(product.id) || 0, releaseDate: new Date(product.releaseDate), salePrice: (_a = product.salePrice) !== null && _a !== void 0 ? _a : undefined }));
            })
                .sort((a, b) => (b.interactionCount || 0) - (a.interactionCount || 0))
                .slice(0, limit);
            await cacheService.setTrendingProducts(timeWindow, result);
            return result;
        }
        catch (error) {
            logger_1.logger.error('Error in getTrendingProducts:', error);
            throw error;
        }
    }
}
exports.RecommendationEngine = RecommendationEngine;
RecommendationEngine.COLLABORATIVE_WEIGHT = 0.7;
RecommendationEngine.CONTENT_WEIGHT = 0.3;
//# sourceMappingURL=recommendationEngine.js.map