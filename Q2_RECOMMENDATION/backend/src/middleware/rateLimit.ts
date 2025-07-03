import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import Redis from 'ioredis';
import { logger } from '../utils/logger';
import { Request } from 'express';

interface User {
  userId: string;
}

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

redis.on('error', (error) => {
  logger.error('Redis connection error:', error);
});

// Define different rate limits for different endpoints
const rateLimits = {
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 requests per windowMs for auth endpoints
    message: 'Too many authentication attempts, please try again later.',
  },
  api: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per windowMs for API endpoints
    message: 'Too many requests, please try again later.',
  },
};

// Create rate limiters with Redis store
export const authRateLimiter = rateLimit({
  windowMs: rateLimits.auth.windowMs,
  max: rateLimits.auth.max,
  message: rateLimits.auth.message,
  store: new RedisStore({
    prefix: 'rl:auth:',
    // @ts-ignore - Type mismatch in RedisStore options
    sendCommand: (...args: string[]) => redis.call(args[0], ...args.slice(1)),
    // @ts-ignore - Redis client type mismatch
    client: redis,
  }),
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return `${req.ip}:${req.path}`;
  },
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'Too Many Requests',
      message: rateLimits.auth.message,
      retryAfter: res.getHeader('Retry-After'),
    });
  },
});

export const apiRateLimiter = rateLimit({
  windowMs: rateLimits.api.windowMs,
  max: rateLimits.api.max,
  message: rateLimits.api.message,
  store: new RedisStore({
    prefix: 'rl:api:',
    // @ts-ignore - Type mismatch in RedisStore options
    sendCommand: (...args: string[]) => redis.call(args[0], ...args.slice(1)),
    // @ts-ignore - Redis client type mismatch
    client: redis,
  }),
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request & { user?: User }) => {
    return req.user ? `user:${req.user.userId}:${req.path}` : `ip:${req.ip}:${req.path}`;
  },
  handler: (req: Request & { user?: User }, res) => {
    const identifier = req.user ? `user ${req.user.userId}` : `IP ${req.ip}`;
    logger.warn(`Rate limit exceeded for ${identifier}`);
    res.status(429).json({
      error: 'Too Many Requests',
      message: rateLimits.api.message,
      retryAfter: res.getHeader('Retry-After'),
    });
  },
  skip: (req) => {
    // Skip rate limiting for certain paths or conditions
    const skipPaths = ['/health', '/metrics'];
    return skipPaths.includes(req.path);
  },
}); 