"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const rateLimit_1 = require("../middleware/rateLimit");
const interaction_1 = require("../controllers/interaction");
const router = (0, express_1.Router)();
router.use(auth_1.authenticateSession);
router.post('/', rateLimit_1.apiRateLimiter, interaction_1.trackInteraction);
router.get('/history', rateLimit_1.apiRateLimiter, interaction_1.getUserInteractions);
router.get('/recently-viewed', rateLimit_1.apiRateLimiter, interaction_1.getRecentlyViewed);
router.get('/recommendations', rateLimit_1.apiRateLimiter, interaction_1.getPersonalizedRecommendations);
exports.default = router;
//# sourceMappingURL=interaction.js.map