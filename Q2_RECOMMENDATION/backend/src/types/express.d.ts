import { Session } from 'express-session';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
      };
      session: Session & {
        userId?: string;
      };
    }
  }
}