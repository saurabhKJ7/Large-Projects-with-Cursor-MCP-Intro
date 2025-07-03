"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMockInteraction = exports.createMockProduct = exports.createMockUser = void 0;
const bcryptjs_1 = require("bcryptjs");
const createMockUser = async (overrides = {}) => {
    const defaultUser = {
        email: 'test@example.com',
        name: 'Test User',
        password: await (0, bcryptjs_1.hash)('password123', 10),
        resetToken: null,
        resetTokenExpiry: null
    };
    return Object.assign(Object.assign({ id: 'user-123', createdAt: new Date(), updatedAt: new Date() }, defaultUser), overrides);
};
exports.createMockUser = createMockUser;
const createMockProduct = (overrides = {}) => {
    const defaultProduct = {
        productId: 12345,
        productName: 'Test Product',
        description: 'A test product description',
        price: 99.99,
        category: 'Electronics',
        subcategory: 'Smartphones',
        manufacturer: 'Test Brand',
        imageUrl: 'https://example.com/image.jpg',
        rating: 4.5,
        quantityInStock: 100,
        isOnSale: false,
        salePrice: overrides.isOnSale ? 79.99 : undefined,
        isFeatured: false,
        weight: 0.5,
        dimensions: '10x5x2',
        releaseDate: new Date(),
        features: JSON.stringify(['Feature 1', 'Feature 2']),
        similarityVector: JSON.stringify([0.1, 0.2, 0.3]),
    };
    return Object.assign(Object.assign({ id: 'product-123', createdAt: new Date(), updatedAt: new Date() }, defaultProduct), overrides);
};
exports.createMockProduct = createMockProduct;
const createMockInteraction = (overrides = {}) => {
    const defaultInteraction = {
        userId: 'user-123',
        productId: 'product-123',
        type: 'view',
    };
    return Object.assign(Object.assign({ id: 'interaction-123', createdAt: new Date(), updatedAt: new Date() }, defaultInteraction), overrides);
};
exports.createMockInteraction = createMockInteraction;
//# sourceMappingURL=mockData.js.map