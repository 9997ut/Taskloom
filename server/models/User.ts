import mongoose, { Schema, Document } from 'mongoose';

export interface IRefreshToken {
  token: string;
  createdAt: Date;
  expiresAt: Date;
}

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  avatarColor: string;
  refreshTokens: IRefreshToken[];
  createdAt: Date;
  updatedAt: Date;
}

const refreshTokenSchema = new Schema<IRefreshToken>(
  {
    token: { type: String, required: true },
    createdAt: { type: Date, required: true, default: Date.now },
    expiresAt: { type: Date, required: true },
  },
  { _id: false },
);

function generateAvatarColor(): string {
  const colors = [
    '#EF4444', '#F97316', '#F59E0B', '#EAB308', '#84CC16',
    '#22C55E', '#14B8A6', '#06B6D4', '#0EA5E9', '#3B82F6',
    '#6366F1', '#8B5CF6', '#A855F7', '#D946EF', '#EC4899',
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    avatarColor: {
      type: String,
      default: generateAvatarColor,
    },
    refreshTokens: [refreshTokenSchema],
  },
  { timestamps: true },
);

const User = mongoose.model<IUser>('User', userSchema);

export default User;
