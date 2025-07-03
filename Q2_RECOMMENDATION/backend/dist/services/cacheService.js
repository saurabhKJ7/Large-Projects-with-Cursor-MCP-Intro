"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheService = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const logger_1 = require("../utils/logger");
class CacheService {
    constructor() {
        this.defaultTTL = 1800;
        this.redis = new ioredis_1.default(process.env.REDIS_URL || 'redis://localhost:6379');
        this.redis.on('error', (error) => {
            logger_1.logger.error('Redis connection error:', error);
        });
        this.redis.on('connect', () => {
            logger_1.logger.info('Redis connected successfully');
        });
    }
    getKey(type, params) {
        return `rec:${type}:${params.join(':')}`;
    }
    async get(type, params) {
        try {
            const key = this.getKey(type, params);
            const data = await this.redis.get(key);
            return data ? JSON.parse(data) : null;
        }
        catch (error) {
            logger_1.logger.error('Cache get error:', error);
            return null;
        }
    }
    async set(type, params, data, ttl = this.defaultTTL) {
        try {
            const key = this.getKey(type, params);
            await this.redis.setex(key, ttl, JSON.stringify(data));
        }
        catch (error) {
            logger_1.logger.error('Cache set error:', error);
        }
    }
    async invalidate(type, params) {
        try {
            const key = this.getKey(type, params);
            await this.redis.del(key);
        }
        catch (error) {
            logger_1.logger.error('Cache invalidation error:', error);
        }
    }
    async getPersonalizedRecommendations(userId) {
        return this.get('personalized', [userId]);
    }
    async setPersonalizedRecommendations(userId, products) {
        await this.set('personalized', [userId], products);
    }
    async getSimilarProducts(productId) {
        return this.get('similar', [productId]);
    }
    async setSimilarProducts(productId, products) {
        await this.set('similar', [productId], products);
    }
    async getTrendingProducts(timeWindow) {
        return this.get('trending', [timeWindow]);
    }
    async setTrendingProducts(timeWindow, products) {
        await this.set('trending', [timeWindow], products);
    }
    async invalidateUserCache(userId) {
        await this.invalidate('personalized', [userId]);
    }
    async invalidateProductCache(productId) {
        await this.invalidate('similar', [productId]);
        await this.invalidate('trending', ['day']);
        await this.invalidate('trending', ['week']);
        await this.invalidate('trending', ['month']);
    }
}
exports.CacheService = CacheService;
//# sourceMappingURL=cacheService.js.map