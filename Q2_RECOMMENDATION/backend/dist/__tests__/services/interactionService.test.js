"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const interactionService_1 = require("../../services/interactionService");
const mockData_1 = require("../utils/mockData");
const mockPrisma = {
    interaction: {
        create: jest.fn(),
        findMany: jest.fn(),
        groupBy: jest.fn(),
    },
};
describe('InteractionService', () => {
    let interactionService;
    beforeEach(() => {
        interactionService = interactionService_1.InteractionService;
        jest.clearAllMocks();
    });
    describe('trackInteraction', () => {
        it('should track user interaction with a product', async () => {
            const mockUser = await (0, mockData_1.createMockUser)();
            const mockProduct = (0, mockData_1.createMockProduct)();
            const interactionData = {
                userId: mockUser.id,
                productId: mockProduct.id,
                type: 'view',
            };
            mockPrisma.interaction.create.mockResolvedValue(Object.assign({ id: '1', createdAt: new Date() }, interactionData));
            const result = await interactionService.trackInteraction(interactionData);
            expect(result).toHaveProperty('id');
            expect(result.userId).toBe(mockUser.id);
            expect(result.productId).toBe(mockProduct.id);
            expect(result.type).toBe('view');
            expect(mockPrisma.interaction.create).toHaveBeenCalledWith({
                data: interactionData,
            });
        });
        it('should handle invalid interaction data', async () => {
            const invalidData = {
                userId: 'invalid-user',
                productId: 'invalid-product',
                type: 'invalid-type',
            };
            mockPrisma.interaction.create.mockRejectedValue(new Error('Invalid data'));
            await expect(interactionService.trackInteraction(invalidData)).rejects.toThrow();
        });
    });
    describe('getUserInteractions', () => {
        it('should return user interactions', async () => {
            const mockUser = (0, mockData_1.createMockUser)();
            const mockProduct = (0, mockData_1.createMockProduct)();
            const mockInteractions = [
                {
                    id: '1',
                    userId: mockUser.id,
                    productId: mockProduct.id,
                    type: 'view',
                    createdAt: new Date(),
                },
                {
                    id: '2',
                    userId: mockUser.id,
                    productId: mockProduct.id,
                    type: 'like',
                    createdAt: new Date(),
                },
            ];
            mockPrisma.interaction.findMany.mockResolvedValue(mockInteractions);
            const result = await interactionService.getUserInteractions(mockUser.id);
            expect(result).toHaveLength(2);
            expect(mockPrisma.interaction.findMany).toHaveBeenCalledWith({
                where: { userId: mockUser.id },
                orderBy: { createdAt: 'desc' },
            });
        });
        it('should handle user with no interactions', async () => {
            const mockUser = (0, mockData_1.createMockUser)();
            mockPrisma.interaction.findMany.mockResolvedValue([]);
            const result = await interactionService.getUserInteractions(mockUser.id);
            expect(result).toHaveLength(0);
        });
    });
    describe('getProductInteractions', () => {
        it('should return product interactions', async () => {
            const mockProduct = (0, mockData_1.createMockProduct)();
            const mockInteractions = [
                {
                    id: '1',
                    userId: 'user1',
                    productId: mockProduct.id,
                    type: 'view',
                    createdAt: new Date(),
                },
                {
                    id: '2',
                    userId: 'user2',
                    productId: mockProduct.id,
                    type: 'like',
                    createdAt: new Date(),
                },
            ];
            mockPrisma.interaction.findMany.mockResolvedValue(mockInteractions);
            const result = await interactionService.getProductInteractions(mockProduct.id);
            expect(result).toHaveLength(2);
            expect(mockPrisma.interaction.findMany).toHaveBeenCalledWith({
                where: { productId: mockProduct.id },
                orderBy: { createdAt: 'desc' },
            });
        });
        it('should handle product with no interactions', async () => {
            const mockProduct = (0, mockData_1.createMockProduct)();
            mockPrisma.interaction.findMany.mockResolvedValue([]);
            const result = await interactionService.getProductInteractions(mockProduct.id);
            expect(result).toHaveLength(0);
        });
    });
});
//# sourceMappingURL=interactionService.test.js.map