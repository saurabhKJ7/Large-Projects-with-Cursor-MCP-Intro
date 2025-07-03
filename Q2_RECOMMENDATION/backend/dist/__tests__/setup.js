"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prismaMock = void 0;
const client_1 = require("@prisma/client");
const jest_mock_extended_1 = require("jest-mock-extended");
jest.mock('@prisma/client', () => ({
    PrismaClient: jest.fn(),
}));
exports.prismaMock = (0, jest_mock_extended_1.mockDeep)();
const prisma = new client_1.PrismaClient();
beforeEach(() => {
    (0, jest_mock_extended_1.mockReset)(exports.prismaMock);
});
process.env.JWT_SECRET = 'test-secret';
process.env.NODE_ENV = 'test';
jest.mock('ioredis', () => {
    const Redis = require('ioredis-mock');
    return Redis;
});
jest.mock('bcrypt', () => ({
    hash: jest.fn().mockResolvedValue('hashed-password'),
    compare: jest.fn().mockResolvedValue(true),
}));
jest.mock('jsonwebtoken', () => ({
    sign: jest.fn().mockReturnValue('mock.jwt.token'),
    verify: jest.fn().mockReturnValue({ id: 'user-123' }),
}));
jest.setTimeout(10000);
//# sourceMappingURL=setup.js.map