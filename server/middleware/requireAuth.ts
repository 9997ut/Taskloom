import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/tokens.js';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

const requireAuth = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      error: {
        message: 'Authentication required',
        code: 'AUTH_REQUIRED',
      },
    });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyAccessToken(token);
    req.user = {
      id: decoded.id,
      name: decoded.name,
      email: decoded.email,
    };
    next();
  } catch (err) {
    if (err instanceof TokenExpiredError) {
      res.status(401).json({
        error: {
          message: 'Access token has expired',
          code: 'TOKEN_EXPIRED',
        },
      });
      return;
    }

    if (err instanceof JsonWebTokenError) {
      res.status(401).json({
        error: {
          message: 'Invalid access token',
          code: 'INVALID_TOKEN',
        },
      });
      return;
    }

    next(err);
  }
};

export default requireAuth;
