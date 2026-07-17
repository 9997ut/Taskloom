import mongoose, { Schema, Document } from 'mongoose';

export interface ILabel extends Document {
  name: string;
  color: string;
  createdAt: Date;
  updatedAt: Date;
}

const labelSchema = new Schema<ILabel>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    color: {
      type: String,
      required: true,
      validate: {
        validator: (v: string) => /^#[0-9A-F]{6}$/i.test(v),
        message: 'Color must be a valid hex value (e.g., #FF5733)',
      },
    },
  },
  { timestamps: true },
);

const Label = mongoose.model<ILabel>('Label', labelSchema);

export default Label;
