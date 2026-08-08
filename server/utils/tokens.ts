import jwt from 'jsonwebtoken';
import crypto from 'crypto';

interface TokenPayload {
  id: string;
  name: string;
  email: string;
}

export function signAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET!, {
    expiresIn: '15m',
  });
}

export function signRefreshToken(payload: { id: string }): string {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, {
    expiresIn: '7d',
    jwtid: crypto.randomUUID(),
  });
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as TokenPayload;
}

export function verifyRefreshToken(token: string): { id: string } {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as { id: string };
}
