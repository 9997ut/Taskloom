import { Response } from 'express';
import bcrypt from 'bcrypt';
import User from '../models/User.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/tokens.js';
import { AuthRequest } from '../middleware/requireAuth.js';

const SALT_ROUNDS = 12;
const REFRESH_TOKEN_EXPIRY_DAYS = 7;

function setRefreshCookie(res: Response, token: string): void {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api/auth',
    maxAge: REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
  });
}

function clearRefreshCookie(res: Response): void {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api/auth',
  });
}

export async function register(req: AuthRequest, res: Response): Promise<void> {
  const { name, email, password } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    res.status(409).json({
      error: {
        message: 'Email is already registered',
        code: 'EMAIL_TAKEN',
        fields: { email: 'Email is already registered' },
      },
    });
    return;
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await User.create({
    name,
    email,
    passwordHash,
  });

  const accessToken = signAccessToken({
    id: user._id.toString(),
    name: user.name,
    email: user.email,
  });

  const refreshToken = signRefreshToken({ id: user._id.toString() });

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

  user.refreshTokens.push({
    token: refreshToken,
    createdAt: new Date(),
    expiresAt,
  });
  await user.save();

  setRefreshCookie(res, refreshToken);

  res.status(201).json({
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      avatarColor: user.avatarColor,
    },
    accessToken,
  });
}

export async function login(req: AuthRequest, res: Response): Promise<void> {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user) {
    res.status(401).json({
      error: {
        message: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS',
      },
    });
    return;
  }

  const passwordMatch = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatch) {
    res.status(401).json({
      error: {
        message: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS',
      },
    });
    return;
  }

  const accessToken = signAccessToken({
    id: user._id.toString(),
    name: user.name,
    email: user.email,
  });

  const refreshToken = signRefreshToken({ id: user._id.toString() });

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

  user.refreshTokens.push({
    token: refreshToken,
    createdAt: new Date(),
    expiresAt,
  });
  await user.save();

  setRefreshCookie(res, refreshToken);

  res.status(200).json({
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      avatarColor: user.avatarColor,
    },
    accessToken,
  });
}

export async function refresh(req: AuthRequest, res: Response): Promise<void> {
  const token = req.cookies?.refreshToken;

  if (!token) {
    res.status(401).json({
      error: {
        message: 'Refresh token is required',
        code: 'NO_REFRESH_TOKEN',
      },
    });
    return;
  }

  let decoded: { id: string };
  try {
    decoded = verifyRefreshToken(token);
  } catch {
    clearRefreshCookie(res);
    res.status(401).json({
      error: {
        message: 'Invalid or expired refresh token',
        code: 'INVALID_REFRESH_TOKEN',
      },
    });
    return;
  }

  const user = await User.findById(decoded.id);
  if (!user) {
    clearRefreshCookie(res);
    res.status(401).json({
      error: {
        message: 'User not found',
        code: 'INVALID_REFRESH_TOKEN',
      },
    });
    return;
  }

  const storedToken = user.refreshTokens.find((rt) => rt.token === token);
  if (!storedToken) {
    clearRefreshCookie(res);
    res.status(401).json({
      error: {
        message: 'Refresh token has been revoked',
        code: 'INVALID_REFRESH_TOKEN',
      },
    });
    return;
  }

  // Rotation: remove old token, issue new one
  user.refreshTokens = user.refreshTokens.filter((rt) => rt.token !== token);

  const newRefreshToken = signRefreshToken({ id: user._id.toString() });
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

  user.refreshTokens.push({
    token: newRefreshToken,
    createdAt: new Date(),
    expiresAt,
  });
  await user.save();

  const accessToken = signAccessToken({
    id: user._id.toString(),
    name: user.name,
    email: user.email,
  });

  setRefreshCookie(res, newRefreshToken);

  res.status(200).json({ accessToken });
}

export async function logout(req: AuthRequest, res: Response): Promise<void> {
  const token = req.cookies?.refreshToken;

  if (token) {
    try {
      const decoded = verifyRefreshToken(token);
      const user = await User.findById(decoded.id);
      if (user) {
        user.refreshTokens = user.refreshTokens.filter((rt) => rt.token !== token);
        await user.save();
      }
    } catch {
      // Gracefully handle invalid/expired token — still clear cookie and return 204
    }
  }

  clearRefreshCookie(res);
  res.status(204).send();
}

export async function getMe(req: AuthRequest, res: Response): Promise<void> {
  const user = await User.findById(req.user!.id);

  if (!user) {
    res.status(401).json({
      error: {
        message: 'User not found',
        code: 'USER_NOT_FOUND',
      },
    });
    return;
  }

  res.json({
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      avatarColor: user.avatarColor,
    },
  });
}
