import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { AppError } from '../utils/appError';

export class AuthController {
  private prisma: PrismaClient;
  private readonly JWT_SECRET: string;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
  }

  public async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, name } = req.body;

      const existingUser = await this.prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        throw new AppError('Email already exists', 400);
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await this.prisma.user.create({
        data: {
          email,
          name,
          password: hashedPassword,
        },
        select: {
          id: true,
          email: true,
          name: true,
        },
      });

      const token = jwt.sign({ userId: user.id }, this.JWT_SECRET, {
        expiresIn: '24h',
      });

      res.status(201).json({
        status: 'success',
        data: {
          user,
          token,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  public async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;

      const user = await this.prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        throw new AppError('Invalid email or password', 401);
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        throw new AppError('Invalid email or password', 401);
      }

      const token = jwt.sign({ userId: user.id }, this.JWT_SECRET, {
        expiresIn: '24h',
      });

      res.status(200).json({
        status: 'success',
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
          },
          token,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  public async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;

      const user = await this.prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        throw new AppError('User not found', 404);
      }

      const resetToken = Math.random().toString(36).slice(-8);
      const resetTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      await this.prisma.user.update({
        where: { email },
        data: {
          resetToken,
          resetTokenExpiry,
        },
      });

      // In a real application, send this token via email
      res.status(200).json({
        status: 'success',
        message: 'Password reset token generated',
        data: {
          resetToken, // In production, don't send this in response
        },
      });
    } catch (error) {
      next(error);
    }
  }

  public async confirmResetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { resetToken, newPassword } = req.body;

      const user = await this.prisma.user.findFirst({
        where: {
          resetToken,
          resetTokenExpiry: {
            gt: new Date(),
          },
        },
      });

      if (!user) {
        throw new AppError('Invalid or expired reset token', 400);
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          resetToken: null,
          resetTokenExpiry: null,
        },
      });

      res.status(200).json({
        status: 'success',
        message: 'Password has been reset successfully',
      });
    } catch (error) {
      next(error);
    }
  }
} 