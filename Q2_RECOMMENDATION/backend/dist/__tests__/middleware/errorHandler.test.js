"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const errorHandler_1 = require("../../middleware/errorHandler");
const library_1 = require("@prisma/client/runtime/library");
describe('Error Handler Middleware', () => {
    let mockReq;
    let mockRes;
    let nextFunction;
    beforeEach(() => {
        mockReq = {};
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
        nextFunction = jest.fn();
    });
    it('should handle validation errors', () => {
        const validationError = new Error('Validation failed');
        validationError.name = 'ValidationError';
        (0, errorHandler_1.errorHandler)(validationError, mockReq, mockRes, nextFunction);
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({
            error: 'Validation failed',
        });
    });
    it('should handle Prisma not found errors', () => {
        const notFoundError = new library_1.PrismaClientKnownRequestError('Record not found', {
            code: 'P2025',
            clientVersion: '4.x.x',
        });
        (0, errorHandler_1.errorHandler)(notFoundError, mockReq, mockRes, nextFunction);
        expect(mockRes.status).toHaveBeenCalledWith(404);
        expect(mockRes.json).toHaveBeenCalledWith({
            error: 'Record not found',
        });
    });
    it('should handle Prisma unique constraint errors', () => {
        const uniqueConstraintError = new library_1.PrismaClientKnownRequestError('Unique constraint failed', {
            code: 'P2002',
            clientVersion: '4.x.x',
        });
        (0, errorHandler_1.errorHandler)(uniqueConstraintError, mockReq, mockRes, nextFunction);
        expect(mockRes.status).toHaveBeenCalledWith(409);
        expect(mockRes.json).toHaveBeenCalledWith({
            error: 'Resource already exists',
        });
    });
    it('should handle Prisma foreign key constraint errors', () => {
        const foreignKeyError = new library_1.PrismaClientKnownRequestError('Foreign key constraint failed', {
            code: 'P2003',
            clientVersion: '4.x.x',
        });
        (0, errorHandler_1.errorHandler)(foreignKeyError, mockReq, mockRes, nextFunction);
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({
            error: 'Invalid reference to related resource',
        });
    });
    it('should handle authentication errors', () => {
        const authError = new Error('Unauthorized');
        authError.name = 'AuthenticationError';
        (0, errorHandler_1.errorHandler)(authError, mockReq, mockRes, nextFunction);
        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockRes.json).toHaveBeenCalledWith({
            error: 'Unauthorized',
        });
    });
    it('should handle authorization errors', () => {
        const authzError = new Error('Forbidden');
        authzError.name = 'AuthorizationError';
        (0, errorHandler_1.errorHandler)(authzError, mockReq, mockRes, nextFunction);
        expect(mockRes.status).toHaveBeenCalledWith(403);
        expect(mockRes.json).toHaveBeenCalledWith({
            error: 'Forbidden',
        });
    });
    it('should handle generic errors', () => {
        const genericError = new Error('Something went wrong');
        (0, errorHandler_1.errorHandler)(genericError, mockReq, mockRes, nextFunction);
        expect(mockRes.status).toHaveBeenCalledWith(500);
        expect(mockRes.json).toHaveBeenCalledWith({
            error: 'Internal server error',
        });
    });
    it('should handle errors with custom status codes', () => {
        const customError = new Error('Custom error');
        customError.statusCode = 422;
        (0, errorHandler_1.errorHandler)(customError, mockReq, mockRes, nextFunction);
        expect(mockRes.status).toHaveBeenCalledWith(422);
        expect(mockRes.json).toHaveBeenCalledWith({
            error: 'Custom error',
        });
    });
});
//# sourceMappingURL=errorHandler.test.js.map