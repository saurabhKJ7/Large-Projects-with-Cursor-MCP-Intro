import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

import crypto from 'crypto';
import {
  LoginRequestSchema,
  RegisterRequestSchema,
  UpdateProfileSchema,
  PasswordResetRequestSchema,
  PasswordResetSchema,
} from '../types/auth';
import { AppError } from '../middleware/errorHandler';

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validatedData = RegisterRequestSchema.parse(req.body);
    
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      throw new AppError(400, 'Email already registered');
    }

    const hashedPassword = await bcrypt.hash(validatedData.password, SALT_ROUNDS);

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
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validatedData = LoginRequestSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (!user) {
      throw new AppError(401, 'Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(
      validatedData.password,
      user.password
    );

    if (!isPasswordValid) {
      throw new AppError(401, 'Invalid email or password');
    }

    const { password, ...userWithoutPassword } = user;
    req.session.userId = user.id;

    res.status(200).json({
      status: 'success',
      data: { user: userWithoutPassword },
    });
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.session.userId;

    if (!userId) {
      throw new AppError(401, 'Not authenticated');
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
      throw new AppError(404, 'User not found');
    }

    res.status(200).json({
      status: 'success',
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.session.userId;

    if (!userId) {
      throw new AppError(401, 'Not authenticated');
    }

    const validatedData = UpdateProfileSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    if (validatedData.currentPassword) {
      const isPasswordValid = await bcrypt.compare(
        validatedData.currentPassword,
        user.password
      );

      if (!isPasswordValid) {
        throw new AppError(401, 'Current password is incorrect');
      }
    }

    const updateData: any = {
      name: validatedData.name,
      email: validatedData.email,
    };

    if (validatedData.newPassword) {
      updateData.password = await bcrypt.hash(validatedData.newPassword, SALT_ROUNDS);
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
  } catch (error) {
    next(error);
  }
};

export const requestPasswordReset = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validatedData = PasswordResetRequestSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry,
      },
    });

    // In a real application, send the reset token via email
    // For now, just return it in the response
    res.status(200).json({
      status: 'success',
      message: 'Password reset token generated',
      data: { resetToken },
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validatedData = PasswordResetSchema.parse(req.body);

    const user = await prisma.user.findFirst({
      where: {
        resetToken: validatedData.token,
        resetTokenExpiry: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      throw new AppError(400, 'Invalid or expired reset token');
    }

    const hashedPassword = await bcrypt.hash(validatedData.password, SALT_ROUNDS);

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
  } catch (error) {
    next(error);
  }
};