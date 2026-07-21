import { Response } from 'express';
import User from '../models/User.js';
import { AuthRequest } from '../middleware/requireAuth.js';

export async function listUsers(_req: AuthRequest, res: Response): Promise<void> {
  const users = await User.find({}).select('name email avatarColor').lean();

  res.json({
    users: users.map((u) => ({
      id: u._id,
      name: u.name,
      email: u.email,
      avatarColor: u.avatarColor,
    })),
  });
}
