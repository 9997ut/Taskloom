import { Response } from 'express';
import { Types } from 'mongoose';
import Comment from '../models/Comment.js';
import Issue from '../models/Issue.js';
import { AuthRequest } from '../middleware/requireAuth.js';

function encodeCursor(createdAt: Date, id: string): string {
  return Buffer.from(JSON.stringify({ s: createdAt.toISOString(), id })).toString('base64');
}

function decodeCursor(cursor: string): { s: string; id: string } | null {
  try {
    const decoded = JSON.parse(Buffer.from(cursor, 'base64').toString('utf-8'));
    if (decoded && typeof decoded.id === 'string' && typeof decoded.s === 'string') {
      return decoded;
    }
    return null;
  } catch {
    return null;
  }
}

export async function listComments(req: AuthRequest, res: Response): Promise<void> {
  const { issueId } = req.params as { issueId: string };
  const { cursor, limit: limitStr } = req.query as Record<string, string | undefined>;

  if (!Types.ObjectId.isValid(issueId)) {
    res.status(404).json({
      error: { message: 'Issue not found', code: 'NOT_FOUND' },
    });
    return;
  }

  const issue = await Issue.findOne({ _id: issueId, isDeleted: false }).select('_id').lean();
  if (!issue) {
    res.status(404).json({
      error: { message: 'Issue not found', code: 'NOT_FOUND' },
    });
    return;
  }

  const parsedLimit = Math.min(Math.max(parseInt(limitStr || '20', 10) || 20, 1), 100);

  const filter: Record<string, unknown> = { issue: new Types.ObjectId(issueId) };

  if (cursor) {
    const decoded = decodeCursor(cursor);
    if (!decoded) {
      res.status(400).json({
        error: { message: 'Invalid cursor', code: 'INVALID_CURSOR' },
      });
      return;
    }
    filter.$or = [
      { createdAt: { $gt: new Date(decoded.s) } },
      { createdAt: new Date(decoded.s), _id: { $gt: new Types.ObjectId(decoded.id) } },
    ];
  }

  const comments = await Comment.find(filter)
    .populate({ path: 'author', select: 'name avatarColor' })
    .sort({ createdAt: 1, _id: 1 })
    .limit(parsedLimit + 1)
    .lean();

  const hasMore = comments.length > parsedLimit;
  const results = hasMore ? comments.slice(0, parsedLimit) : comments;

  let nextCursor: string | null = null;
  if (hasMore && results.length > 0) {
    const last = results[results.length - 1];
    nextCursor = encodeCursor(last.createdAt, last._id.toString());
  }

  res.json({
    comments: results.map((c) => ({
      id: c._id,
      issue: c.issue,
      author: c.author,
      text: c.text,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    })),
    nextCursor,
  });
}

export async function createComment(req: AuthRequest, res: Response): Promise<void> {
  const { issueId } = req.params as { issueId: string };

  if (!Types.ObjectId.isValid(issueId)) {
    res.status(404).json({
      error: { message: 'Issue not found', code: 'NOT_FOUND' },
    });
    return;
  }

  const issue = await Issue.findOne({ _id: issueId, isDeleted: false });
  if (!issue) {
    res.status(404).json({
      error: { message: 'Issue not found', code: 'NOT_FOUND' },
    });
    return;
  }

  const comment = await Comment.create({
    issue: new Types.ObjectId(issueId),
    author: new Types.ObjectId(req.user!.id),
    text: req.body.text,
  });

  issue.activityLog.push({
    type: 'comment_added',
    description: 'Comment added',
    actor: new Types.ObjectId(req.user!.id),
    createdAt: new Date(),
  } as any);
  await issue.save();

  const populated = await Comment.findById(comment._id)
    .populate({ path: 'author', select: 'name avatarColor' })
    .lean();

  res.status(201).json({
    comment: {
      id: populated!._id,
      issue: populated!.issue,
      author: populated!.author,
      text: populated!.text,
      createdAt: populated!.createdAt,
      updatedAt: populated!.updatedAt,
    },
  });
}

export async function deleteComment(req: AuthRequest, res: Response): Promise<void> {
  const { issueId, commentId } = req.params as { issueId: string; commentId: string };

  if (!Types.ObjectId.isValid(issueId) || !Types.ObjectId.isValid(commentId)) {
    res.status(404).json({
      error: { message: 'Not found', code: 'NOT_FOUND' },
    });
    return;
  }

  const issue = await Issue.findOne({ _id: issueId, isDeleted: false }).select('_id').lean();
  if (!issue) {
    res.status(404).json({
      error: { message: 'Issue not found', code: 'NOT_FOUND' },
    });
    return;
  }

  const comment = await Comment.findById(commentId);
  if (!comment || comment.issue.toString() !== issueId) {
    res.status(404).json({
      error: { message: 'Comment not found', code: 'NOT_FOUND' },
    });
    return;
  }

  if (comment.author.toString() !== req.user!.id) {
    res.status(403).json({
      error: { message: 'You can only delete your own comments', code: 'FORBIDDEN' },
    });
    return;
  }

  await Comment.findByIdAndDelete(commentId);

  res.status(204).send();
}
