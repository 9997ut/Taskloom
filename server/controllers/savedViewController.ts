import { Response } from 'express';
import SavedView from '../models/SavedView.js';
import { AuthRequest } from '../middleware/requireAuth.js';
import { Types } from 'mongoose';

export async function listSavedViews(req: AuthRequest, res: Response): Promise<void> {
  const views = await SavedView.find({ owner: req.user!.id })
    .sort({ createdAt: -1 })
    .lean();

  res.json({
    views: views.map((v) => ({
      id: v._id,
      name: v.name,
      filters: v.filters,
      createdAt: v.createdAt,
      updatedAt: v.updatedAt,
    })),
  });
}

export async function createSavedView(req: AuthRequest, res: Response): Promise<void> {
  const { name, filters } = req.body;

  const view = await SavedView.create({
    owner: new Types.ObjectId(req.user!.id),
    name,
    filters,
  });

  res.status(201).json({
    view: {
      id: view._id,
      name: view.name,
      filters: view.filters,
      createdAt: view.createdAt,
      updatedAt: view.updatedAt,
    },
  });
}

export async function deleteSavedView(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params as { id: string };

  if (!Types.ObjectId.isValid(id)) {
    res.status(404).json({
      error: { message: 'View not found', code: 'NOT_FOUND' },
    });
    return;
  }

  const view = await SavedView.findById(id);
  if (!view) {
    res.status(404).json({
      error: { message: 'View not found', code: 'NOT_FOUND' },
    });
    return;
  }

  if (view.owner.toString() !== req.user!.id) {
    res.status(403).json({
      error: { message: 'You can only delete your own saved views', code: 'FORBIDDEN' },
    });
    return;
  }

  await SavedView.findByIdAndDelete(id);

  res.status(204).send();
}
