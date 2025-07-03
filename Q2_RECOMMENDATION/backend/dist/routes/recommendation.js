"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const recommendation_1 = require("../controllers/recommendation");
const auth_1 = require("../middleware/auth");
const rateLimit_1 = require("../middleware/rateLimit");
const router = express_1.default.Router();
router.use(rateLimit_1.apiRateLimiter);
router.get('/personalized', auth_1.authenticateSession, recommendation_1.RecommendationController.getPersonalizedRecommendations);
router.get('/similar/:productId', recommendation_1.RecommendationController.getSimilarProducts);
router.get('/trending', recommendation_1.RecommendationController.getTrendingProducts);
router.get('/cold-start', recommendation_1.RecommendationController.getColdStartRecommendations);
exports.default = router;
//# sourceMappingURL=recommendation.js.map