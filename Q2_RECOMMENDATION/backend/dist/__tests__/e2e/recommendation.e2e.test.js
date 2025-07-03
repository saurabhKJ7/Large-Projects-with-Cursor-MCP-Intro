"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = require("../../app");
const mockData_1 = require("../utils/mockData");
const client_1 = require("@prisma/client");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma = new client_1.PrismaClient();
describe('Product Recommendation E2E Tests', () => {
    let authToken;
    let testUser;
    let testProducts;
    beforeAll(async () => {
        testUser = await prisma.user.create({
            data: await (0, mockData_1.createMockUser)(),
        });
        testProducts = await Promise.all(Array.from({ length: 5 }, async () => {
            return prisma.product.create({
                data: (0, mockData_1.createMockProduct)(),
            });
        }));
        authToken = jsonwebtoken_1.default.sign({ id: testUser.id }, process.env.JWT_SECRET || 'test-secret');
    });
    afterAll(async () => {
        await prisma.interaction.deleteMany({
            where: {
                userId: testUser.id,
            },
        });
        await prisma.product.deleteMany({
            where: {
                id: {
                    in: testProducts.map(p => p.id),
                },
            },
        });
        await prisma.user.delete({
            where: {
                id: testUser.id,
            },
        });
        await prisma.$disconnect();
    });
    describe('Personalized Recommendations', () => {
        it('should return personalized recommendations based on user interactions', async () => {
            await prisma.interaction.createMany({
                data: testProducts.slice(0, 3).map(product => ({
                    userId: testUser.id,
                    productId: product.id,
                    type: 'view',
                    metadata: { source: 'test' },
                })),
            });
            const response = await (0, supertest_1.default)(app_1.app)
                .get('/api/recommendations/personalized')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);
            expect(response.body).toHaveLength(4);
            expect(response.body[0]).toHaveProperty('id');
            expect(response.body[0]).toHaveProperty('productName');
        });
        it('should return 401 without auth token', async () => {
            await (0, supertest_1.default)(app_1.app)
                .get('/api/recommendations/personalized')
                .expect(401);
        });
    });
    describe('Similar Products', () => {
        it('should return similar products', async () => {
            const response = await (0, supertest_1.default)(app_1.app)
                .get(`/api/recommendations/similar/${testProducts[0].id}`)
                .expect(200);
            expect(response.body).toHaveLength(4);
            expect(response.body[0]).toHaveProperty('id');
            expect(response.body[0]).toHaveProperty('productName');
        });
        it('should handle non-existent product', async () => {
            await (0, supertest_1.default)(app_1.app)
                .get('/api/recommendations/similar/non-existent-id')
                .expect(404);
        });
    });
    describe('Trending Products', () => {
        it('should return trending products', async () => {
            await prisma.interaction.createMany({
                data: testProducts.map(product => ({
                    userId: testUser.id,
                    productId: product.id,
                    type: 'view',
                    metadata: { source: 'test' },
                })),
            });
            const response = await (0, supertest_1.default)(app_1.app)
                .get('/api/recommendations/trending')
                .query({ timeWindow: 'week' })
                .expect(200);
            expect(response.body).toHaveLength(4);
            expect(response.body[0]).toHaveProperty('id');
            expect(response.body[0]).toHaveProperty('productName');
        });
        it('should handle different time windows', async () => {
            const timeWindows = ['day', 'week', 'month'];
            for (const timeWindow of timeWindows) {
                const response = await (0, supertest_1.default)(app_1.app)
                    .get('/api/recommendations/trending')
                    .query({ timeWindow })
                    .expect(200);
                expect(response.body).toBeInstanceOf(Array);
            }
        });
    });
    describe('Interaction Tracking', () => {
        it('should track user interactions with recommendations', async () => {
            const interaction = {
                productId: testProducts[0].id,
                type: 'click',
                metadata: {
                    source: 'recommendation',
                    reason: 'trending',
                },
            };
            const response = await (0, supertest_1.default)(app_1.app)
                .post('/api/interactions')
                .set('Authorization', `Bearer ${authToken}`)
                .send(interaction)
                .expect(201);
            expect(response.body).toHaveProperty('id');
            expect(response.body.productId).toBe(testProducts[0].id);
            expect(response.body.type).toBe('click');
        });
        it('should require authentication for interaction tracking', async () => {
            const interaction = {
                productId: testProducts[0].id,
                type: 'click',
                metadata: { source: 'test' },
            };
            await (0, supertest_1.default)(app_1.app)
                .post('/api/interactions')
                .send(interaction)
                .expect(401);
        });
    });
});
//# sourceMappingURL=recommendation.e2e.test.js.map