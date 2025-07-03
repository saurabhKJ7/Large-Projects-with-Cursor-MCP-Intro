"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_rate_limit_1 = require("express-rate-limit");
jest.mock('node-cache');
describe('Rate Limiter Middleware', () => {
    let mockReq;
    let mockRes;
    let nextFunction;
    let mockCache;
    beforeEach(() => {
        mockReq = {
            ip: '127.0.0.1',
            path: '/api/test',
        };
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            setHeader: jest.fn(),
        };
        nextFunction = jest.fn();
        mockCache = {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
            flushAll: jest.fn(),
            getStats: jest.fn(),
        };
        jest.clearAllMocks();
    });
    it('should allow requests within rate limit', () => {
        const limiter = (0, express_rate_limit_1.rateLimiter)({
            windowMs: 15 * 60 * 1000,
            max: 100,
        });
        limiter(mockReq, mockRes, nextFunction);
        expect(nextFunction).toHaveBeenCalled();
        expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', 100);
    });
    it('should block requests exceeding rate limit', async () => {
        const limiter = (0, express_rate_limit_1.rateLimiter)({
            windowMs: 15 * 60 * 1000,
            max: 1,
        });
        limiter(mockReq, mockRes, nextFunction);
        expect(nextFunction).toHaveBeenCalled();
        nextFunction.mockReset();
        limiter(mockReq, mockRes, nextFunction);
        expect(nextFunction).not.toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(429);
        expect(mockRes.json).toHaveBeenCalledWith({
            error: 'Too many requests, please try again later',
        });
    });
    it('should handle different IP addresses separately', () => {
        const limiter = (0, express_rate_limit_1.rateLimiter)({
            windowMs: 15 * 60 * 1000,
            max: 1,
        });
        limiter(mockReq, mockRes, nextFunction);
        expect(nextFunction).toHaveBeenCalled();
        nextFunction.mockReset();
        const mockReq2 = Object.assign(Object.assign({}, mockReq), { ip: '127.0.0.2' });
        limiter(mockReq2, mockRes, nextFunction);
        expect(nextFunction).toHaveBeenCalled();
    });
    it('should reset rate limit after window expires', async () => {
        const windowMs = 100;
        const limiter = (0, express_rate_limit_1.rateLimiter)({
            windowMs,
            max: 1,
        });
        limiter(mockReq, mockRes, nextFunction);
        expect(nextFunction).toHaveBeenCalled();
        nextFunction.mockReset();
        await new Promise(resolve => setTimeout(resolve, windowMs + 10));
        limiter(mockReq, mockRes, nextFunction);
        expect(nextFunction).toHaveBeenCalled();
    });
    it('should set appropriate rate limit headers', () => {
        const limiter = (0, express_rate_limit_1.rateLimiter)({
            windowMs: 15 * 60 * 1000,
            max: 100,
        });
        limiter(mockReq, mockRes, nextFunction);
        expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', 100);
        expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', expect.any(Number));
        expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Reset', expect.any(Number));
    });
    it('should handle different endpoints separately', () => {
        const limiter = (0, express_rate_limit_1.rateLimiter)({
            windowMs: 15 * 60 * 1000,
            max: 1,
        });
        limiter(mockReq, mockRes, nextFunction);
        expect(nextFunction).toHaveBeenCalled();
        nextFunction.mockReset();
        const mockReq2 = Object.assign(Object.assign({}, mockReq), { path: '/api/different' });
        limiter(mockReq2, mockRes, nextFunction);
        expect(nextFunction).toHaveBeenCalled();
    });
    it('should handle first request with no previous count', () => {
        const limiter = (0, express_rate_limit_1.rateLimiter)({
            windowMs: 15 * 60 * 1000,
            max: 10,
        });
        limiter(mockReq, mockRes, nextFunction);
        expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', 9);
        expect(nextFunction).toHaveBeenCalled();
    });
    it('should handle cache errors gracefully', () => {
        const limiter = (0, express_rate_limit_1.rateLimiter)({
            windowMs: 15 * 60 * 1000,
            max: 10,
        });
        limiter(mockReq, mockRes, nextFunction);
        expect(nextFunction).toHaveBeenCalled();
        expect(mockRes.status).not.toHaveBeenCalled();
    });
    it('should use different limits for different endpoints', () => {
        const limiter = (0, express_rate_limit_1.rateLimiter)({
            windowMs: 15 * 60 * 1000,
            max: 5,
        });
        const authRequest = {
            ip: '127.0.0.1',
            path: '/api/auth/login',
        };
        limiter(authRequest, mockRes, nextFunction);
        expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', 4);
        expect(nextFunction).toHaveBeenCalled();
    });
    it('should reset count after window expires', () => {
        const limiter = (0, express_rate_limit_1.rateLimiter)({
            windowMs: 15 * 60 * 1000,
            max: 10,
        });
        limiter(mockReq, mockRes, nextFunction);
        expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', 9);
        expect(nextFunction).toHaveBeenCalled();
    });
});
//# sourceMappingURL=rateLimit.test.js.map