"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const rateLimit_1 = require("../middleware/rateLimit");
const product_1 = require("../controllers/product");
const router = (0, express_1.Router)();
router.get('/', rateLimit_1.apiRateLimiter, product_1.getProducts);
router.get('/:id', rateLimit_1.apiRateLimiter, product_1.getProductById);
router.get('/:id/similar', rateLimit_1.apiRateLimiter, product_1.getSimilarProducts);
router.post('/', auth_1.authenticateSession, product_1.createProduct);
router.put('/:id', auth_1.authenticateSession, product_1.updateProduct);
router.delete('/:id', auth_1.authenticateSession, product_1.deleteProduct);
exports.default = router;
//# sourceMappingURL=product.js.map