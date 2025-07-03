import { Request, Response, NextFunction } from 'express';
import { errorHandler } from '../../middleware/errorHandler';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

describe('Error Handler Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let nextFunction: NextFunction;

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

    errorHandler(validationError, mockReq as Request, mockRes as Response, nextFunction);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: 'Validation failed',
    });
  });

  it('should handle Prisma not found errors', () => {
    const notFoundError = new PrismaClientKnownRequestError('Record not found', {
      code: 'P2025',
      clientVersion: '4.x.x',
    });

    errorHandler(notFoundError, mockReq as Request, mockRes as Response, nextFunction);

    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: 'Record not found',
    });
  });

  it('should handle Prisma unique constraint errors', () => {
    const uniqueConstraintError = new PrismaClientKnownRequestError('Unique constraint failed', {
      code: 'P2002',
      clientVersion: '4.x.x',
    });

    errorHandler(uniqueConstraintError, mockReq as Request, mockRes as Response, nextFunction);

    expect(mockRes.status).toHaveBeenCalledWith(409);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: 'Resource already exists',
    });
  });

  it('should handle Prisma foreign key constraint errors', () => {
    const foreignKeyError = new PrismaClientKnownRequestError('Foreign key constraint failed', {
      code: 'P2003',
      clientVersion: '4.x.x',
    });

    errorHandler(foreignKeyError, mockReq as Request, mockRes as Response, nextFunction);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: 'Invalid reference to related resource',
    });
  });

  it('should handle authentication errors', () => {
    const authError = new Error('Unauthorized');
    authError.name = 'AuthenticationError';

    errorHandler(authError, mockReq as Request, mockRes as Response, nextFunction);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: 'Unauthorized',
    });
  });

  it('should handle authorization errors', () => {
    const authzError = new Error('Forbidden');
    authzError.name = 'AuthorizationError';

    errorHandler(authzError, mockReq as Request, mockRes as Response, nextFunction);

    expect(mockRes.status).toHaveBeenCalledWith(403);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: 'Forbidden',
    });
  });

  it('should handle generic errors', () => {
    const genericError = new Error('Something went wrong');

    errorHandler(genericError, mockReq as Request, mockRes as Response, nextFunction);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: 'Internal server error',
    });
  });

  it('should handle errors with custom status codes', () => {
    const customError = new Error('Custom error');
    (customError as any).statusCode = 422;

    errorHandler(customError, mockReq as Request, mockRes as Response, nextFunction);

    expect(mockRes.status).toHaveBeenCalledWith(422);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: 'Custom error',
    });
  });
}); 