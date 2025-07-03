"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiRateLimiter = exports.authRateLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const rate_limit_redis_1 = __importDefault(require("rate-limit-redis"));
const ioredis_1 = __importDefault(require("ioredis"));
const logger_1 = require("../utils/logger");
const redis = new ioredis_1.default(process.env.REDIS_URL || 'redis://localhost:6379');
redis.on('error', (error) => {
    logger_1.logger.error('Redis connection error:', error);
});
const rateLimits = {
    auth: {
        windowMs: 15 * 60 * 1000,
        max: 5,
        message: 'Too many authentication attempts, please try again later.',
    },
    api: {
        windowMs: 15 * 60 * 1000,
        max: 100,
        message: 'Too many requests, please try again later.',
    },
};
exports.authRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: rateLimits.auth.windowMs,
    max: rateLimits.auth.max,
    message: rateLimits.auth.message,
    store: new rate_limit_redis_1.default({
        prefix: 'rl:auth:',
        sendCommand: (...args) => redis.call(args[0], ...args.slice(1)),
        client: redis,
    }),
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        return `${req.ip}:${req.path}`;
    },
    handler: (req, res) => {
        logger_1.logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
        res.status(429).json({
            error: 'Too Many Requests',
            message: rateLimits.auth.message,
            retryAfter: res.getHeader('Retry-After'),
        });
    },
});
exports.apiRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: rateLimits.api.windowMs,
    max: rateLimits.api.max,
    message: rateLimits.api.message,
    store: new rate_limit_redis_1.default({
        prefix: 'rl:api:',
        sendCommand: (...args) => redis.call(args[0], ...args.slice(1)),
        client: redis,
    }),
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        return req.user ? `user:${req.user.userId}:${req.path}` : `ip:${req.ip}:${req.path}`;
    },
    handler: (req, res) => {
        const identifier = req.user ? `user ${req.user.userId}` : `IP ${req.ip}`;
        logger_1.logger.warn(`Rate limit exceeded for ${identifier}`);
        res.status(429).json({
            error: 'Too Many Requests',
            message: rateLimits.api.message,
            retryAfter: res.getHeader('Retry-After'),
        });
    },
    skip: (req) => {
        const skipPaths = ['/health', '/metrics'];
        return skipPaths.includes(req.path);
    },
});
//# sourceMappingURL=rateLimit.js.map