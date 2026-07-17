import mongoose, { Schema, Document, Types } from 'mongoose';

export const STATUS_VALUES = ['backlog', 'todo', 'in-progress', 'done', 'cancelled'] as const;
export const PRIORITY_VALUES = ['none', 'low', 'medium', 'high', 'urgent'] as const;
export const ACTIVITY_TYPES = [
  'created',
  'status_changed',
  'priority_changed',
  'assignee_changed',
  'label_added',
  'label_removed',
  'comment_added',
  'subtask_added',
  'subtask_completed',
] as const;

export type IssueStatus = (typeof STATUS_VALUES)[number];
export type IssuePriority = (typeof PRIORITY_VALUES)[number];
export type ActivityType = (typeof ACTIVITY_TYPES)[number];

export interface ISubtask {
  _id: Types.ObjectId;
  title: string;
  done: boolean;
  createdAt: Date;
}

export interface IActivityEntry {
  _id: Types.ObjectId;
  type: ActivityType;
  description: string;
  actor: Types.ObjectId;
  createdAt: Date;
}

export interface IIssue extends Document {
  title: string;
  description: string;
  status: IssueStatus;
  priority: IssuePriority;
  labels: Types.ObjectId[];
  assignee: Types.ObjectId | null;
  reporter: Types.ObjectId;
  subtasks: ISubtask[];
  activityLog: IActivityEntry[];
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const subtaskSchema = new Schema<ISubtask>(
  {
    title: { type: String, required: true, trim: true },
    done: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
  },
);

const activityEntrySchema = new Schema<IActivityEntry>(
  {
    type: {
      type: String,
      required: true,
      enum: ACTIVITY_TYPES,
    },
    description: { type: String, required: true },
    actor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now },
  },
);

const issueSchema = new Schema<IIssue>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      default: '',
      maxlength: 20000,
    },
    status: {
      type: String,
      enum: STATUS_VALUES,
      default: 'backlog',
      index: true,
    },
    priority: {
      type: String,
      enum: PRIORITY_VALUES,
      default: 'none',
      index: true,
    },
    labels: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Label',
      },
    ],
    assignee: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reporter: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    subtasks: [subtaskSchema],
    activityLog: [activityEntrySchema],
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true },
);

issueSchema.index({ status: 1, priority: 1 });
issueSchema.index({ title: 'text', description: 'text' });

const Issue = mongoose.model<IIssue>('Issue', issueSchema);

export default Issue;
