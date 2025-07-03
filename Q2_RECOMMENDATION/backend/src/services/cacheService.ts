import Redis from 'ioredis';
import { Product } from '../types/product';
import { logger } from '../utils/logger';

export class CacheService {
  private redis: Redis;
  private defaultTTL: number = 1800; // 30 minutes

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
    
    this.redis.on('error', (error) => {
      logger.error('Redis connection error:', error);
    });

    this.redis.on('connect', () => {
      logger.info('Redis connected successfully');
    });
  }

  private getKey(type: string, params: string[]): string {
    return `rec:${type}:${params.join(':')}`;
  }

  async get<T>(type: string, params: string[]): Promise<T | null> {
    try {
      const key = this.getKey(type, params);
      const data = await this.redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error('Cache get error:', error);
      return null;
    }
  }

  async set<T>(type: string, params: string[], data: T, ttl: number = this.defaultTTL): Promise<void> {
    try {
      const key = this.getKey(type, params);
      await this.redis.setex(key, ttl, JSON.stringify(data));
    } catch (error) {
      logger.error('Cache set error:', error);
    }
  }

  async invalidate(type: string, params: string[]): Promise<void> {
    try {
      const key = this.getKey(type, params);
      await this.redis.del(key);
    } catch (error) {
      logger.error('Cache invalidation error:', error);
    }
  }

  async getPersonalizedRecommendations(userId: string): Promise<Product[] | null> {
    return this.get<Product[]>('personalized', [userId]);
  }

  async setPersonalizedRecommendations(userId: string, products: Product[]): Promise<void> {
    await this.set('personalized', [userId], products);
  }

  async getSimilarProducts(productId: string): Promise<Product[] | null> {
    return this.get<Product[]>('similar', [productId]);
  }

  async setSimilarProducts(productId: string, products: Product[]): Promise<void> {
    await this.set('similar', [productId], products);
  }

  async getTrendingProducts(timeWindow: string): Promise<Product[] | null> {
    return this.get<Product[]>('trending', [timeWindow]);
  }

  async setTrendingProducts(timeWindow: string, products: Product[]): Promise<void> {
    await this.set('trending', [timeWindow], products);
  }

  async invalidateUserCache(userId: string): Promise<void> {
    await this.invalidate('personalized', [userId]);
  }

  async invalidateProductCache(productId: string): Promise<void> {
    await this.invalidate('similar', [productId]);
    // Also invalidate trending cache as product updates might affect trending
    await this.invalidate('trending', ['day']);
    await this.invalidate('trending', ['week']);
    await this.invalidate('trending', ['month']);
  }
} 