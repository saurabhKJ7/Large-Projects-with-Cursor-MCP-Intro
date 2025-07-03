"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecommendationScoreSchema = exports.InteractionStatsSchema = exports.UserPreferenceSchema = exports.InteractionWeights = exports.InteractionSchema = void 0;
exports.calculateInteractionWeight = calculateInteractionWeight;
exports.calculateCategoryPreference = calculateCategoryPreference;
const zod_1 = require("zod");
exports.InteractionSchema = zod_1.z.object({
    type: zod_1.z.enum(['search', 'view', 'like', 'purchase', 'addToCart', 'removeFromCart']),
    productId: zod_1.z.string(),
});
exports.InteractionWeights = {
    search: 1,
    view: 2,
    like: 3,
    addToCart: 4,
    purchase: 5,
    removeFromCart: -2,
};
function calculateInteractionWeight(type) {
    return exports.InteractionWeights[type];
}
function calculateCategoryPreference(interactions, categoryMap) {
    const preferences = {};
    interactions.forEach((interaction) => {
        const category = categoryMap[interaction.productId];
        if (category) {
            const weight = calculateInteractionWeight(interaction.type);
            preferences[category] = (preferences[category] || 0) + weight;
        }
    });
    return preferences;
}
exports.UserPreferenceSchema = zod_1.z.object({
    userId: zod_1.z.string(),
    category: zod_1.z.string(),
    weight: zod_1.z.number(),
});
exports.InteractionStatsSchema = zod_1.z.object({
    totalInteractions: zod_1.z.number(),
    uniqueUsers: zod_1.z.number(),
    uniqueProducts: zod_1.z.number(),
    interactionsByType: zod_1.z.record(zod_1.z.number()),
});
exports.RecommendationScoreSchema = zod_1.z.object({
    productId: zod_1.z.string(),
    score: zod_1.z.number(),
    confidence: zod_1.z.number(),
});
//# sourceMappingURL=interaction.js.map