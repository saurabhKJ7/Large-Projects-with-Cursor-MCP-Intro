"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateSession = void 0;
const errorHandler_1 = require("./errorHandler");
const authenticateSession = async (req, _res, next) => {
    try {
        if (!req.session.userId) {
            throw new errorHandler_1.AppError(401, 'Not authenticated');
        }
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.authenticateSession = authenticateSession;
//# sourceMappingURL=auth.js.map