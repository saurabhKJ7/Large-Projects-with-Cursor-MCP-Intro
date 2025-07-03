"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.AppError = void 0;
const zod_1 = require("zod");
const logger_1 = require("../utils/logger");
class AppError extends Error {
    constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
        this.name = 'AppError';
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
const errorHandler = (error, _req, res, _next) => {
    logger_1.logger.error('Error:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
    });
    if (error instanceof AppError) {
        return res.status(error.statusCode).json({
            status: 'error',
            message: error.message,
        });
    }
    if (error instanceof zod_1.ZodError) {
        return res.status(400).json({
            status: 'error',
            message: 'Validation error',
            errors: error.errors,
        });
    }
    if (error.name === 'PrismaClientKnownRequestError') {
        return res.status(400).json({
            status: 'error',
            message: 'Database operation failed',
        });
    }
    return res.status(500).json({
        status: 'error',
        message: 'Internal server error',
    });
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=errorHandler.js.map