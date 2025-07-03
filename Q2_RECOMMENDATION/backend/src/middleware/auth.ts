import { Request, Response, NextFunction } from 'express';

import { AppError } from './errorHandler';

declare module 'express-session' {
  interface SessionData {
    userId?: string;
  }
}

export const authenticateSession = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    if (!req.session.userId) {
      throw new AppError(401, 'Not authenticated');
    }
    next();
  } catch (error) {
    next(error);
  }
};