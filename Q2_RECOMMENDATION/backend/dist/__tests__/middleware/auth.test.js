"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const auth_1 = require("../../middleware/auth");
const mockData_1 = require("../utils/mockData");
describe('Auth Middleware', () => {
    let mockRequest;
    let mockResponse;
    let nextFunction = jest.fn();
    beforeEach(() => {
        mockRequest = {
            session: {},
        };
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
        jest.clearAllMocks();
    });
    it('should return 401 if no session exists', async () => {
        await (0, auth_1.authenticateSession)(mockRequest, mockResponse, nextFunction);
        expect(mockResponse.status).toHaveBeenCalledWith(401);
        expect(mockResponse.json).toHaveBeenCalledWith({
            error: 'Not authenticated',
        });
        expect(nextFunction).not.toHaveBeenCalled();
    });
    it('should return 401 if no userId in session', async () => {
        mockRequest.session = {};
        await (0, auth_1.authenticateSession)(mockRequest, mockResponse, nextFunction);
        expect(mockResponse.status).toHaveBeenCalledWith(401);
        expect(mockResponse.json).toHaveBeenCalledWith({
            error: 'Not authenticated',
        });
        expect(nextFunction).not.toHaveBeenCalled();
    });
    it('should call next() with valid session', async () => {
        const mockUser = await (0, mockData_1.createMockUser)();
        mockRequest.session = { userId: mockUser.id };
        await (0, auth_1.authenticateSession)(mockRequest, mockResponse, nextFunction);
        expect(nextFunction).toHaveBeenCalled();
        expect(mockResponse.status).not.toHaveBeenCalled();
        expect(mockResponse.json).not.toHaveBeenCalled();
    });
});
//# sourceMappingURL=auth.test.js.map