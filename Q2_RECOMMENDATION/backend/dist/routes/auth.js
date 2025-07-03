"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const express_1 = require("express");
const auth_1 = require("../controllers/auth");
const auth_2 = require("../middleware/auth");
const rateLimit_1 = require("../middleware/rateLimit");
const router = (0, express_1.Router)();
exports.authRouter = router;
router.post('/register', rateLimit_1.authRateLimiter, auth_1.register);
router.post('/login', rateLimit_1.authRateLimiter, auth_1.login);
router.post('/password-reset-request', rateLimit_1.authRateLimiter, auth_1.requestPasswordReset);
router.post('/password-reset', rateLimit_1.authRateLimiter, auth_1.resetPassword);
router.get('/me', auth_2.authenticateSession, auth_1.getProfile);
router.patch('/profile', auth_2.authenticateSession, auth_1.updateProfile);
//# sourceMappingURL=auth.js.map