"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPassword = exports.requestPasswordReset = exports.updateProfile = exports.getProfile = exports.login = exports.register = void 0;
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const crypto_1 = __importDefault(require("crypto"));
const auth_1 = require("../types/auth");
const errorHandler_1 = require("../middleware/errorHandler");
const prisma = new client_1.PrismaClient();
const SALT_ROUNDS = 10;
const register = async (req, res, next) => {
    try {
        const validatedData = auth_1.RegisterRequestSchema.parse(req.body);
        const existingUser = await prisma.user.findUnique({
            where: { email: validatedData.email },
        });
        if (existingUser) {
            throw new errorHandler_1.AppError(400, 'Email already registered');
        }
        const hashedPassword = await bcryptjs_1.default.hash(validatedData.password, SALT_ROUNDS);
        const user = await prisma.user.create({
            data: {
                email: validatedData.email,
                name: validatedData.name,
                password: hashedPassword,
            },
            select: {
                id: true,
                email: true,
                name: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        req.session.userId = user.id;
        res.status(201).json({
            status: 'success',
            data: { user },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.register = register;
const login = async (req, res, next) => {
    try {
        const validatedData = auth_1.LoginRequestSchema.parse(req.body);
        const user = await prisma.user.findUnique({
            where: { email: validatedData.email },
        });
        if (!user) {
            throw new errorHandler_1.AppError(401, 'Invalid email or password');
        }
        const isPasswordValid = await bcryptjs_1.default.compare(validatedData.password, user.password);
        if (!isPasswordValid) {
            throw new errorHandler_1.AppError(401, 'Invalid email or password');
        }
        const { password } = user, userWithoutPassword = __rest(user, ["password"]);
        req.session.userId = user.id;
        res.status(200).json({
            status: 'success',
            data: { user: userWithoutPassword },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.login = login;
const getProfile = async (req, res, next) => {
    try {
        const userId = req.session.userId;
        if (!userId) {
            throw new errorHandler_1.AppError(401, 'Not authenticated');
        }
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                name: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        if (!user) {
            throw new errorHandler_1.AppError(404, 'User not found');
        }
        res.status(200).json({
            status: 'success',
            data: { user },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getProfile = getProfile;
const updateProfile = async (req, res, next) => {
    try {
        const userId = req.session.userId;
        if (!userId) {
            throw new errorHandler_1.AppError(401, 'Not authenticated');
        }
        const validatedData = auth_1.UpdateProfileSchema.parse(req.body);
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new errorHandler_1.AppError(404, 'User not found');
        }
        if (validatedData.currentPassword) {
            const isPasswordValid = await bcryptjs_1.default.compare(validatedData.currentPassword, user.password);
            if (!isPasswordValid) {
                throw new errorHandler_1.AppError(401, 'Current password is incorrect');
            }
        }
        const updateData = {
            name: validatedData.name,
            email: validatedData.email,
        };
        if (validatedData.newPassword) {
            updateData.password = await bcryptjs_1.default.hash(validatedData.newPassword, SALT_ROUNDS);
        }
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: updateData,
            select: {
                id: true,
                email: true,
                name: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        res.status(200).json({
            status: 'success',
            data: { user: updatedUser },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateProfile = updateProfile;
const requestPasswordReset = async (req, res, next) => {
    try {
        const validatedData = auth_1.PasswordResetRequestSchema.parse(req.body);
        const user = await prisma.user.findUnique({
            where: { email: validatedData.email },
        });
        if (!user) {
            throw new errorHandler_1.AppError(404, 'User not found');
        }
        const resetToken = crypto_1.default.randomBytes(32).toString('hex');
        const resetTokenExpiry = new Date(Date.now() + 3600000);
        await prisma.user.update({
            where: { id: user.id },
            data: {
                resetToken,
                resetTokenExpiry,
            },
        });
        res.status(200).json({
            status: 'success',
            message: 'Password reset token generated',
            data: { resetToken },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.requestPasswordReset = requestPasswordReset;
const resetPassword = async (req, res, next) => {
    try {
        const validatedData = auth_1.PasswordResetSchema.parse(req.body);
        const user = await prisma.user.findFirst({
            where: {
                resetToken: validatedData.token,
                resetTokenExpiry: {
                    gt: new Date(),
                },
            },
        });
        if (!user) {
            throw new errorHandler_1.AppError(400, 'Invalid or expired reset token');
        }
        const hashedPassword = await bcryptjs_1.default.hash(validatedData.password, SALT_ROUNDS);
        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                resetToken: null,
                resetTokenExpiry: null,
            },
        });
        res.status(200).json({
            status: 'success',
            message: 'Password has been reset',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.resetPassword = resetPassword;
//# sourceMappingURL=auth.js.map