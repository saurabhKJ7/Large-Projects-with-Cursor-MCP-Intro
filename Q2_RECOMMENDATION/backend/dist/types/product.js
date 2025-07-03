"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchRequestSchema = exports.ProductFilterSchema = exports.ProductSchema = void 0;
exports.calculateCosineSimilarity = calculateCosineSimilarity;
exports.parseVector = parseVector;
exports.stringifyVector = stringifyVector;
exports.extractFeatures = extractFeatures;
const zod_1 = require("zod");
exports.ProductSchema = zod_1.z.object({
    productName: zod_1.z.string(),
    description: zod_1.z.string(),
    productId: zod_1.z.number(),
    category: zod_1.z.string(),
    subcategory: zod_1.z.string(),
    price: zod_1.z.number(),
    quantityInStock: zod_1.z.number(),
    manufacturer: zod_1.z.string(),
    rating: zod_1.z.number(),
    isFeatured: zod_1.z.boolean(),
    isOnSale: zod_1.z.boolean(),
    salePrice: zod_1.z.number().optional(),
    features: zod_1.z.string(),
    similarityVector: zod_1.z.string(),
    weight: zod_1.z.number(),
    dimensions: zod_1.z.string(),
    releaseDate: zod_1.z.date(),
    imageUrl: zod_1.z.string(),
});
exports.ProductFilterSchema = zod_1.z.object({
    category: zod_1.z.string().optional(),
    subcategory: zod_1.z.string().optional(),
    manufacturer: zod_1.z.string().optional(),
    minPrice: zod_1.z.number().optional(),
    maxPrice: zod_1.z.number().optional(),
    minRating: zod_1.z.number().optional(),
    isFeatured: zod_1.z.boolean().optional(),
    isOnSale: zod_1.z.boolean().optional(),
    sortBy: zod_1.z.enum(['price', 'rating', 'createdAt']).optional(),
    sortOrder: zod_1.z.enum(['asc', 'desc']).optional(),
});
exports.SearchRequestSchema = zod_1.z.object({
    query: zod_1.z.string().optional(),
    page: zod_1.z.number().optional(),
    limit: zod_1.z.number().optional(),
    filter: exports.ProductFilterSchema.optional(),
});
function calculateCosineSimilarity(vec1, vec2) {
    if (vec1.length !== vec2.length) {
        throw new Error('Vectors must have the same length');
    }
    const dotProduct = vec1.reduce((acc, val, i) => acc + val * vec2[i], 0);
    const norm1 = Math.sqrt(vec1.reduce((acc, val) => acc + val * val, 0));
    const norm2 = Math.sqrt(vec2.reduce((acc, val) => acc + val * val, 0));
    if (norm1 === 0 || norm2 === 0) {
        return 0;
    }
    return dotProduct / (norm1 * norm2);
}
function parseVector(vectorString) {
    try {
        return JSON.parse(vectorString);
    }
    catch (error) {
        throw new Error('Invalid vector format');
    }
}
function stringifyVector(vector) {
    return JSON.stringify(vector);
}
function extractFeatures(product) {
    return {
        price: product.price,
        quantity: product.quantityInStock,
        weight: product.weight,
        rating: product.rating,
        isOnSale: product.isOnSale ? 1 : 0,
        descriptionLength: product.description.length,
        releaseDate: product.releaseDate.getTime(),
        dimensionsArray: product.dimensions.split('x').map(Number).reduce((a, b) => a + b, 0),
    };
}
//# sourceMappingURL=product.js.map