"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PasswordResetSchema = exports.PasswordResetRequestSchema = exports.UpdateProfileSchema = exports.LoginRequestSchema = exports.RegisterRequestSchema = void 0;
const zod_1 = require("zod");
exports.RegisterRequestSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    name: zod_1.z.string().min(2),
    password: zod_1.z.string().min(8),
});
exports.LoginRequestSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string(),
});
exports.UpdateProfileSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).optional(),
    email: zod_1.z.string().email().optional(),
    currentPassword: zod_1.z.string().optional(),
    newPassword: zod_1.z.string().min(8).optional(),
}).refine((data) => {
    if (data.newPassword && !data.currentPassword) {
        throw new Error('Current password is required when setting new password');
    }
    return true;
});
exports.PasswordResetRequestSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
});
exports.PasswordResetSchema = zod_1.z.object({
    token: zod_1.z.string(),
    password: zod_1.z.string().min(8),
});
//# sourceMappingURL=auth.js.map