import { Response } from 'express';
import Label from '../models/Label.js';
import Issue from '../models/Issue.js';
import SavedView from '../models/SavedView.js';
import { AuthRequest } from '../middleware/requireAuth.js';
import { Types } from 'mongoose';

export async function listLabels(_req: AuthRequest, res: Response): Promise<void> {
  const labels = await Label.find({}).sort({ name: 1 }).lean();

  res.json({
    labels: labels.map((l) => ({
      id: l._id,
      name: l.name,
      color: l.color,
      createdAt: l.createdAt,
      updatedAt: l.updatedAt,
    })),
  });
}

export async function createLabel(req: AuthRequest, res: Response): Promise<void> {
  const { name, color } = req.body;

  const existing = await Label.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
  if (existing) {
    res.status(409).json({
      error: {
        message: 'A label with this name already exists',
        code: 'LABEL_EXISTS',
        fields: { name: 'Label name is already taken' },
      },
    });
    return;
  }

  const label = await Label.create({ name, color });

  res.status(201).json({
    label: {
      id: label._id,
      name: label.name,
      color: label.color,
      createdAt: label.createdAt,
      updatedAt: label.updatedAt,
    },
  });
}

export async function updateLabel(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;

  if (!Types.ObjectId.isValid(id)) {
    res.status(404).json({
      error: { message: 'Label not found', code: 'NOT_FOUND' },
    });
    return;
  }

  const label = await Label.findById(id);
  if (!label) {
    res.status(404).json({
      error: { message: 'Label not found', code: 'NOT_FOUND' },
    });
    return;
  }

  const { name, color } = req.body;

  if (name && name !== label.name) {
    const existing = await Label.findOne({
      name: { $regex: new RegExp(`^${name}$`, 'i') },
      _id: { $ne: label._id },
    });
    if (existing) {
      res.status(409).json({
        error: {
          message: 'A label with this name already exists',
          code: 'LABEL_EXISTS',
          fields: { name: 'Label name is already taken' },
        },
      });
      return;
    }
    label.name = name;
  }

  if (color !== undefined) {
    label.color = color;
  }

  await label.save();

  res.json({
    label: {
      id: label._id,
      name: label.name,
      color: label.color,
      createdAt: label.createdAt,
      updatedAt: label.updatedAt,
    },
  });
}

export async function deleteLabel(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;

  if (!Types.ObjectId.isValid(id)) {
    res.status(404).json({
      error: { message: 'Label not found', code: 'NOT_FOUND' },
    });
    return;
  }

  const label = await Label.findById(id);
  if (!label) {
    res.status(404).json({
      error: { message: 'Label not found', code: 'NOT_FOUND' },
    });
    return;
  }

  // Clean up references: remove from all issues and saved views
  await Issue.updateMany(
    { labels: label._id },
    { $pull: { labels: label._id } },
  );

  await SavedView.updateMany(
    { 'filters.labels': id },
    { $pull: { 'filters.labels': id } },
  );

  await Label.findByIdAndDelete(id);

  res.status(204).send();
}
