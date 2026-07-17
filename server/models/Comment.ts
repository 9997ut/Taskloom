import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IComment extends Document {
  issue: Types.ObjectId;
  author: Types.ObjectId;
  text: string;
  createdAt: Date;
  updatedAt: Date;
}

const commentSchema = new Schema<IComment>(
  {
    issue: {
      type: Schema.Types.ObjectId,
      ref: 'Issue',
      required: true,
      index: true,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    text: {
      type: String,
      required: true,
      maxlength: 5000,
    },
  },
  { timestamps: true },
);

const Comment = mongoose.model<IComment>('Comment', commentSchema);

export default Comment;
