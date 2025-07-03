"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const recommendationEngine_1 = require("../../services/recommendationEngine");
const mockData_1 = require("../utils/mockData");
const mockPrisma = {
    product: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
    },
    interaction: {
        findMany: jest.fn(),
    },
};
describe('RecommendationEngine', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    describe('getPersonalizedRecommendations', () => {
        it('should return personalized recommendations based on user interactions', async () => {
            const mockUser = await (0, mockData_1.createMockUser)();
            const mockProducts = Array.from({ length: 5 }, () => (0, mockData_1.createMockProduct)());
            const mockInteractions = mockProducts.slice(0, 3).map(product => ({
                userId: mockUser.id,
                productId: product.id,
                type: 'view',
                createdAt: new Date(),
            }));
            mockPrisma.interaction.findMany.mockResolvedValue(mockInteractions);
            mockPrisma.product.findMany.mockResolvedValue(mockProducts);
            const recommendations = await recommendationEngine_1.RecommendationEngine.getHybridRecommendations(mockUser.id);
            expect(recommendations).toHaveLength(4);
            expect(mockPrisma.interaction.findMany).toHaveBeenCalledWith({
                where: { userId: mockUser.id },
                orderBy: { createdAt: 'desc' },
                take: 10,
            });
            expect(mockPrisma.product.findMany).toHaveBeenCalled();
        });
        it('should handle users with no interactions', async () => {
            const mockUser = await (0, mockData_1.createMockUser)();
            const mockProducts = Array.from({ length: 5 }, () => (0, mockData_1.createMockProduct)());
            mockPrisma.interaction.findMany.mockResolvedValue([]);
            mockPrisma.product.findMany.mockResolvedValue(mockProducts);
            const recommendations = await recommendationEngine_1.RecommendationEngine.getHybridRecommendations(mockUser.id);
            expect(recommendations).toHaveLength(4);
            expect(recommendations).toEqual(expect.arrayContaining(mockProducts.slice(0, 4)));
        });
    });
    describe('getSimilarProducts', () => {
        it('should return similar products based on product features', async () => {
            const sourceProduct = (0, mockData_1.createMockProduct)();
            const similarProducts = Array.from({ length: 4 }, () => (0, mockData_1.createMockProduct)());
            mockPrisma.product.findUnique.mockResolvedValue(sourceProduct);
            mockPrisma.product.findMany.mockResolvedValue(similarProducts);
            const recommendations = await recommendationEngine_1.RecommendationEngine.getSimilarProducts(sourceProduct.id);
            expect(recommendations).toHaveLength(4);
            expect(mockPrisma.product.findUnique).toHaveBeenCalledWith({
                where: { id: sourceProduct.id },
            });
            expect(mockPrisma.product.findMany).toHaveBeenCalled();
        });
        it('should throw error for non-existent product', async () => {
            mockPrisma.product.findUnique.mockResolvedValue(null);
            await expect(recommendationEngine_1.RecommendationEngine.getSimilarProducts('non-existent-id')).rejects.toThrow('Product not found');
        });
    });
    describe('getTrendingProducts', () => {
        it('should return trending products based on recent interactions', async () => {
            const mockProducts = Array.from({ length: 5 }, () => (0, mockData_1.createMockProduct)());
            const mockInteractions = mockProducts.map(product => ({
                productId: product.id,
                type: 'view',
                createdAt: new Date(),
            }));
            mockPrisma.interaction.findMany.mockResolvedValue(mockInteractions);
            mockPrisma.product.findMany.mockResolvedValue(mockProducts);
            const recommendations = await recommendationEngine_1.RecommendationEngine.getTrendingProducts('week');
            expect(recommendations).toHaveLength(4);
            expect(mockPrisma.interaction.findMany).toHaveBeenCalled();
            expect(mockPrisma.product.findMany).toHaveBeenCalled();
        });
        it('should handle different time windows', async () => {
            const timeWindows = ['day', 'week', 'month'];
            const mockProducts = Array.from({ length: 5 }, () => (0, mockData_1.createMockProduct)());
            mockPrisma.interaction.findMany.mockResolvedValue([]);
            mockPrisma.product.findMany.mockResolvedValue(mockProducts);
            for (const timeWindow of timeWindows) {
                const recommendations = await recommendationEngine_1.RecommendationEngine.getTrendingProducts(timeWindow);
                expect(recommendations).toHaveLength(4);
            }
        });
    });
});
//# sourceMappingURL=recommendationEngine.test.js.map