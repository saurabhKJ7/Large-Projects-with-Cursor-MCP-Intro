import { Request, Response, NextFunction } from 'express';
import { createClient } from 'redis';
import { AppError } from '../utils/appError';
import rateLimit from 'express-rate-limit';

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

redisClient.on('error', (err) => console.error('Redis Client Error', err));

interface RateLimitOptions {
  windowMs: number;
  max: number;
  message?: string;
  statusCode?: number;
  keyGenerator?: (req: Request) => string;
}

const createRedisStore = () => {
  const storeClient = redisClient;

  return {
    async increment(key: string): Promise<{ totalHits: number; resetTime: Date }> {
      const multi = storeClient.multi();
      const now = Date.now();
      const windowMs = 15 * 60 * 1000; // 15 minutes

      multi.zadd(key, { score: now, value: now.toString() });
      multi.zremrangebyscore(key, 0, now - windowMs);
      multi.zcard(key);
      multi.pexpire(key, windowMs);

      const results = await multi.exec();
      const totalHits = results ? (results[2] as number) : 0;

      return {
        totalHits,
        resetTime: new Date(now + windowMs),
      };
    },

    async decrement(key: string): Promise<void> {
      const now = Date.now();
      await storeClient.zremrangebyscore(key, now, now);
    },

    async resetKey(key: string): Promise<void> {
      await storeClient.del(key);
    },
  };
};

export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later',
  statusCode: 429,
  store: createRedisStore(),
  keyGenerator: (req: Request) => {
    return req.ip || req.headers['x-forwarded-for']?.toString() || req.socket.remoteAddress || 'unknown';
  },
}); 