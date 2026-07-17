import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ISavedViewFilters {
  status?: string[];
  priority?: string[];
  labels?: string[];
  assignee?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ISavedView extends Document {
  owner: Types.ObjectId;
  name: string;
  filters: ISavedViewFilters;
  createdAt: Date;
  updatedAt: Date;
}

const savedViewSchema = new Schema<ISavedView>(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    filters: {
      type: Schema.Types.Mixed,
      required: true,
    },
  },
  { timestamps: true },
);

const SavedView = mongoose.model<ISavedView>('SavedView', savedViewSchema);

export default SavedView;
