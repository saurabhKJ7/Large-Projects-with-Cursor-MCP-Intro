"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const auth_1 = require("../../controllers/auth");
const setup_1 = require("../setup");
const mockData_1 = require("../utils/mockData");
const bcryptjs_1 = require("bcryptjs");
jest.mock('bcryptjs');
describe('AuthController', () => {
    let authController;
    let mockRequest;
    let mockResponse;
    let mockJson;
    let mockStatus;
    let mockSession;
    beforeEach(() => {
        mockJson = jest.fn();
        mockStatus = jest.fn().mockReturnThis();
        mockSession = {};
        mockResponse = {
            json: mockJson,
            status: mockStatus,
        };
        mockRequest = {
            session: mockSession
        };
        authController = new auth_1.AuthController(setup_1.prismaMock);
    });
    describe('register', () => {
        it('should register a new user successfully', async () => {
            const userData = {
                email: 'test@example.com',
                password: 'password123',
                name: 'Test User',
            };
            mockRequest = {
                body: userData,
            };
            const mockUser = await (0, mockData_1.createMockUser)({
                email: userData.email,
                name: userData.name,
            });
            setup_1.prismaMock.user.create.mockResolvedValue(mockUser);
            await authController.register(mockRequest, mockResponse);
            expect(setup_1.prismaMock.user.create).toHaveBeenCalled();
            expect(mockStatus).toHaveBeenCalledWith(201);
            expect(mockJson).toHaveBeenCalledWith(expect.objectContaining({
                user: expect.objectContaining({
                    id: mockUser.id,
                    email: mockUser.email,
                }),
            }));
        });
        it('should handle duplicate email registration', async () => {
            const userData = {
                email: 'existing@example.com',
                password: 'password123',
                name: 'Test User',
            };
            mockRequest = {
                body: userData,
            };
            setup_1.prismaMock.user.create.mockRejectedValue(new Error('Unique constraint failed on email'));
            await authController.register(mockRequest, mockResponse);
            expect(mockStatus).toHaveBeenCalledWith(400);
            expect(mockJson).toHaveBeenCalledWith(expect.objectContaining({
                error: expect.stringContaining('email already exists'),
            }));
        });
    });
    describe('login', () => {
        it('should login user successfully with correct credentials', async () => {
            const loginData = {
                email: 'test@example.com',
                password: 'password123',
            };
            mockRequest = {
                body: loginData,
            };
            const mockUser = await (0, mockData_1.createMockUser)({ email: loginData.email });
            setup_1.prismaMock.user.findUnique.mockResolvedValue(mockUser);
            bcryptjs_1.compare.mockResolvedValue(true);
            await authController.login(mockRequest, mockResponse);
            expect(mockStatus).toHaveBeenCalledWith(200);
            expect(mockJson).toHaveBeenCalledWith(expect.objectContaining({
                user: expect.objectContaining({
                    id: mockUser.id,
                    email: mockUser.email,
                }),
            }));
        });
        it('should reject login with incorrect password', async () => {
            const loginData = {
                email: 'test@example.com',
                password: 'wrongpassword',
            };
            mockRequest = {
                body: loginData,
            };
            const mockUser = await (0, mockData_1.createMockUser)({ email: loginData.email });
            setup_1.prismaMock.user.findUnique.mockResolvedValue(mockUser);
            bcryptjs_1.compare.mockResolvedValue(false);
            await authController.login(mockRequest, mockResponse);
            expect(mockStatus).toHaveBeenCalledWith(401);
            expect(mockJson).toHaveBeenCalledWith(expect.objectContaining({
                error: expect.stringContaining('Invalid credentials'),
            }));
        });
        it('should handle non-existent user login attempt', async () => {
            const loginData = {
                email: 'nonexistent@example.com',
                password: 'password123',
            };
            mockRequest = {
                body: loginData,
            };
            setup_1.prismaMock.user.findUnique.mockResolvedValue(null);
            await authController.login(mockRequest, mockResponse);
            expect(mockStatus).toHaveBeenCalledWith(401);
            expect(mockJson).toHaveBeenCalledWith(expect.objectContaining({
                error: expect.stringContaining('Invalid credentials'),
            }));
        });
    });
    describe('me', () => {
        it('should return authenticated user details', async () => {
            const mockUser = await (0, mockData_1.createMockUser)();
            mockRequest = {
                session: { userId: mockUser.id },
            };
            setup_1.prismaMock.user.findUnique.mockResolvedValue(mockUser);
            await authController.me(mockRequest, mockResponse);
            expect(mockStatus).toHaveBeenCalledWith(200);
            expect(mockJson).toHaveBeenCalledWith(expect.objectContaining({
                user: expect.objectContaining({
                    id: mockUser.id,
                    email: mockUser.email,
                }),
            }));
        });
        it('should handle non-existent authenticated user', async () => {
            mockRequest = {
                session: { userId: 'non-existent-id' },
            };
            setup_1.prismaMock.user.findUnique.mockResolvedValue(null);
            await authController.me(mockRequest, mockResponse);
            expect(mockStatus).toHaveBeenCalledWith(404);
            expect(mockJson).toHaveBeenCalledWith(expect.objectContaining({
                error: expect.stringContaining('User not found'),
            }));
        });
    });
});
//# sourceMappingURL=auth.test.js.map