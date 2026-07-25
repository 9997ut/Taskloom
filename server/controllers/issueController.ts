import { Response } from 'express';
import mongoose, { Types, FilterQuery, SortOrder } from 'mongoose';
import Issue, { IIssue, STATUS_VALUES, PRIORITY_VALUES } from '../models/Issue.js';
import User from '../models/User.js';
import Label from '../models/Label.js';
import { AuthRequest } from '../middleware/requireAuth.js';
import { generateActivityDiff } from '../utils/activityLog.js';

const POPULATE_LIST = [
  { path: 'labels', select: 'name color' },
  { path: 'assignee', select: 'name avatarColor' },
];

const POPULATE_DETAIL = [
  { path: 'labels', select: 'name color' },
  { path: 'assignee', select: 'name avatarColor' },
  { path: 'reporter', select: 'name avatarColor' },
  { path: 'activityLog.actor', select: 'name avatarColor' },
];

function encodeCursor(sortValue: unknown, id: string): string {
  return Buffer.from(JSON.stringify({ s: sortValue, id })).toString('base64');
}

function decodeCursor(cursor: string): { s: unknown; id: string } | null {
  try {
    const decoded = JSON.parse(Buffer.from(cursor, 'base64').toString('utf-8'));
    if (decoded && typeof decoded.id === 'string') {
      return decoded;
    }
    return null;
  } catch {
    return null;
  }
}

export async function listIssues(req: AuthRequest, res: Response): Promise<void> {
  const {
    status,
    priority,
    labels,
    assignee,
    search,
    sortBy = 'updatedAt',
    sortOrder = 'desc',
    cursor,
    limit = 20,
  } = req.query as Record<string, string | undefined>;

  const parsedLimit = Math.min(Math.max(parseInt(limit || '20', 10) || 20, 1), 100);

  const filter: FilterQuery<IIssue> = { isDeleted: false };

  if (status) {
    const statuses = status.split(',');
    for (const s of statuses) {
      if (!(STATUS_VALUES as readonly string[]).includes(s)) {
        res.status(400).json({
          error: { message: `Invalid status value: ${s}`, code: 'INVALID_QUERY' },
        });
        return;
      }
    }
    filter.status = { $in: statuses };
  }

  if (priority) {
    const priorities = priority.split(',');
    for (const p of priorities) {
      if (!(PRIORITY_VALUES as readonly string[]).includes(p)) {
        res.status(400).json({
          error: { message: `Invalid priority value: ${p}`, code: 'INVALID_QUERY' },
        });
        return;
      }
    }
    filter.priority = { $in: priorities };
  }

  if (labels) {
    const labelIds = labels.split(',');
    for (const id of labelIds) {
      if (!Types.ObjectId.isValid(id)) {
        res.status(400).json({
          error: { message: `Invalid label ID: ${id}`, code: 'INVALID_QUERY' },
        });
        return;
      }
    }
    const existingLabels = await Label.find({ _id: { $in: labelIds } }).select('_id').lean();
    if (existingLabels.length !== labelIds.length) {
      res.status(400).json({
        error: { message: 'One or more label IDs do not exist', code: 'INVALID_QUERY' },
      });
      return;
    }
    filter.labels = { $in: labelIds.map((id) => new Types.ObjectId(id)) };
  }

  if (assignee) {
    if (!Types.ObjectId.isValid(assignee)) {
      res.status(400).json({
        error: { message: 'Invalid assignee ID', code: 'INVALID_QUERY' },
      });
      return;
    }
    filter.assignee = new Types.ObjectId(assignee);
  }

  if (search && search.trim()) {
    filter.$text = { $search: search.trim() };
  }

  const validSortFields = ['title', 'status', 'priority', 'assignee', 'createdAt', 'updatedAt'];
  const actualSortBy = validSortFields.includes(sortBy || '') ? sortBy! : 'updatedAt';

  if (sortBy && !validSortFields.includes(sortBy)) {
    res.status(400).json({
      error: { message: `Invalid sortBy value: ${sortBy}`, code: 'INVALID_QUERY' },
    });
    return;
  }

  const validSortOrders = ['asc', 'desc'];
  if (sortOrder && !validSortOrders.includes(sortOrder)) {
    res.status(400).json({
      error: { message: `Invalid sortOrder value: ${sortOrder}`, code: 'INVALID_QUERY' },
    });
    return;
  }

  const direction: SortOrder = (sortOrder as 'asc' | 'desc') || 'desc';
  const sort: Record<string, SortOrder> = { [actualSortBy]: direction, _id: direction };

  if (cursor) {
    const decoded = decodeCursor(cursor);
    if (!decoded) {
      res.status(400).json({
        error: { message: 'Invalid cursor', code: 'INVALID_CURSOR' },
      });
      return;
    }

    const op = direction === 'desc' ? '$lt' : '$gt';
    filter.$or = [
      { [actualSortBy]: { [op]: decoded.s } },
      { [actualSortBy]: decoded.s, _id: { [op]: new Types.ObjectId(decoded.id) } },
    ];
  }

  const issues = await Issue.find(filter)
    .select('title status priority labels assignee updatedAt createdAt')
    .populate(POPULATE_LIST)
    .sort(sort)
    .limit(parsedLimit + 1)
    .lean();

  const hasMore = issues.length > parsedLimit;
  const results = hasMore ? issues.slice(0, parsedLimit) : issues;

  let nextCursor: string | null = null;
  if (hasMore && results.length > 0) {
    const lastItem = results[results.length - 1];
    nextCursor = encodeCursor(
      lastItem[actualSortBy as keyof typeof lastItem],
      lastItem._id.toString(),
    );
  }

  res.json({
    issues: results.map((issue) => ({
      id: issue._id,
      title: issue.title,
      status: issue.status,
      priority: issue.priority,
      labels: issue.labels,
      assignee: issue.assignee,
      updatedAt: issue.updatedAt,
      createdAt: issue.createdAt,
    })),
    nextCursor,
  });
}

export async function createIssue(req: AuthRequest, res: Response): Promise<void> {
  const { title, description, status, priority, labels: labelIds, assignee } = req.body;

  if (assignee) {
    const userExists = await User.findById(assignee).lean();
    if (!userExists) {
      res.status(400).json({
        error: { message: 'Assignee user does not exist', code: 'INVALID_ASSIGNEE' },
      });
      return;
    }
  }

  if (labelIds && labelIds.length > 0) {
    for (const id of labelIds) {
      if (!Types.ObjectId.isValid(id)) {
        res.status(400).json({
          error: { message: `Invalid label ID: ${id}`, code: 'INVALID_LABEL' },
        });
        return;
      }
    }
    const existingLabels = await Label.find({ _id: { $in: labelIds } }).select('_id').lean();
    if (existingLabels.length !== labelIds.length) {
      res.status(400).json({
        error: { message: 'One or more label IDs do not exist', code: 'INVALID_LABEL' },
      });
      return;
    }
  }

  const issue = await Issue.create({
    title,
    description: description || '',
    status: status || 'backlog',
    priority: priority || 'none',
    labels: labelIds || [],
    assignee: assignee || null,
    reporter: new Types.ObjectId(req.user!.id),
    activityLog: [
      {
        type: 'created',
        description: 'Issue created',
        actor: new Types.ObjectId(req.user!.id),
        createdAt: new Date(),
      },
    ],
  });

  const populated = await Issue.findById(issue._id)
    .populate(POPULATE_DETAIL)
    .lean();

  res.status(201).json({ issue: populated });
}

export async function getIssue(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;

  if (!Types.ObjectId.isValid(id)) {
    res.status(404).json({
      error: { message: 'Issue not found', code: 'NOT_FOUND' },
    });
    return;
  }

  const issue = await Issue.findOne({ _id: id, isDeleted: false })
    .populate(POPULATE_DETAIL)
    .lean();

  if (!issue) {
    res.status(404).json({
      error: { message: 'Issue not found', code: 'NOT_FOUND' },
    });
    return;
  }

  const commentCount = await mongoose.model('Comment').countDocuments({ issue: id });

  res.json({
    issue: {
      ...issue,
      id: issue._id,
      commentsCount: commentCount,
    },
  });
}

export async function updateIssue(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;

  if (!Types.ObjectId.isValid(id)) {
    res.status(404).json({
      error: { message: 'Issue not found', code: 'NOT_FOUND' },
    });
    return;
  }

  const issue = await Issue.findOne({ _id: id, isDeleted: false });
  if (!issue) {
    res.status(404).json({
      error: { message: 'Issue not found', code: 'NOT_FOUND' },
    });
    return;
  }

  const updates = req.body;

  if (updates.assignee) {
    const userExists = await User.findById(updates.assignee).lean();
    if (!userExists) {
      res.status(400).json({
        error: { message: 'Assignee user does not exist', code: 'INVALID_ASSIGNEE' },
      });
      return;
    }
  }

  if (updates.labels && updates.labels.length > 0) {
    for (const labelId of updates.labels) {
      if (!Types.ObjectId.isValid(labelId)) {
        res.status(400).json({
          error: { message: `Invalid label ID: ${labelId}`, code: 'INVALID_LABEL' },
        });
        return;
      }
    }
    const existingLabels = await Label.find({ _id: { $in: updates.labels } }).select('_id').lean();
    if (existingLabels.length !== updates.labels.length) {
      res.status(400).json({
        error: { message: 'One or more label IDs do not exist', code: 'INVALID_LABEL' },
      });
      return;
    }
  }

  const activityEntries = generateActivityDiff(issue, updates, req.user!.id);

  if (updates.title !== undefined) issue.title = updates.title;
  if (updates.description !== undefined) issue.description = updates.description;
  if (updates.status !== undefined) issue.status = updates.status;
  if (updates.priority !== undefined) issue.priority = updates.priority;
  if (updates.labels !== undefined) issue.labels = updates.labels.map((l: string) => new Types.ObjectId(l));
  if (updates.assignee !== undefined) issue.assignee = updates.assignee ? new Types.ObjectId(updates.assignee) : null;

  for (const entry of activityEntries) {
    issue.activityLog.push({
      ...entry,
      actor: new Types.ObjectId(entry.actor),
      createdAt: new Date(),
    } as any);
  }

  await issue.save();

  const populated = await Issue.findById(issue._id)
    .populate(POPULATE_DETAIL)
    .lean();

  res.json({ issue: populated });
}

export async function deleteIssue(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;

  if (!Types.ObjectId.isValid(id)) {
    res.status(404).json({
      error: { message: 'Issue not found', code: 'NOT_FOUND' },
    });
    return;
  }

  const issue = await Issue.findOne({ _id: id, isDeleted: false });
  if (!issue) {
    res.status(404).json({
      error: { message: 'Issue not found', code: 'NOT_FOUND' },
    });
    return;
  }

  issue.isDeleted = true;
  await issue.save();

  res.status(204).send();
}

export async function createSubtask(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;

  if (!Types.ObjectId.isValid(id)) {
    res.status(404).json({
      error: { message: 'Issue not found', code: 'NOT_FOUND' },
    });
    return;
  }

  const issue = await Issue.findOne({ _id: id, isDeleted: false });
  if (!issue) {
    res.status(404).json({
      error: { message: 'Issue not found', code: 'NOT_FOUND' },
    });
    return;
  }

  const subtask = {
    _id: new Types.ObjectId(),
    title: req.body.title,
    done: false,
    createdAt: new Date(),
  };

  issue.subtasks.push(subtask as any);
  issue.activityLog.push({
    type: 'subtask_added',
    description: `Subtask added: ${req.body.title}`,
    actor: new Types.ObjectId(req.user!.id),
    createdAt: new Date(),
  } as any);

  await issue.save();

  res.status(201).json({ subtask });
}

export async function updateSubtask(req: AuthRequest, res: Response): Promise<void> {
  const { id, subtaskId } = req.params;

  if (!Types.ObjectId.isValid(id)) {
    res.status(404).json({
      error: { message: 'Issue not found', code: 'NOT_FOUND' },
    });
    return;
  }

  const issue = await Issue.findOne({ _id: id, isDeleted: false });
  if (!issue) {
    res.status(404).json({
      error: { message: 'Issue not found', code: 'NOT_FOUND' },
    });
    return;
  }

  const subtask = issue.subtasks.find((s) => s._id.toString() === subtaskId);
  if (!subtask) {
    res.status(404).json({
      error: { message: 'Subtask not found', code: 'NOT_FOUND' },
    });
    return;
  }

  const wasDone = subtask.done;

  if (req.body.title !== undefined) subtask.title = req.body.title;
  if (req.body.done !== undefined) subtask.done = req.body.done;

  if (!wasDone && subtask.done) {
    issue.activityLog.push({
      type: 'subtask_completed',
      description: `Subtask completed: ${subtask.title}`,
      actor: new Types.ObjectId(req.user!.id),
      createdAt: new Date(),
    } as any);
  }

  await issue.save();

  res.json({ subtask });
}

export async function deleteSubtask(req: AuthRequest, res: Response): Promise<void> {
  const { id, subtaskId } = req.params;

  if (!Types.ObjectId.isValid(id)) {
    res.status(404).json({
      error: { message: 'Issue not found', code: 'NOT_FOUND' },
    });
    return;
  }

  const issue = await Issue.findOne({ _id: id, isDeleted: false });
  if (!issue) {
    res.status(404).json({
      error: { message: 'Issue not found', code: 'NOT_FOUND' },
    });
    return;
  }

  const subtaskIndex = issue.subtasks.findIndex((s) => s._id.toString() === subtaskId);
  if (subtaskIndex === -1) {
    res.status(404).json({
      error: { message: 'Subtask not found', code: 'NOT_FOUND' },
    });
    return;
  }

  issue.subtasks.splice(subtaskIndex, 1);
  await issue.save();

  res.status(204).send();
}
