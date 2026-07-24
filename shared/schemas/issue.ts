import { z } from 'zod';

const STATUS_VALUES = ['backlog', 'todo', 'in-progress', 'done', 'cancelled'] as const;
const PRIORITY_VALUES = ['none', 'low', 'medium', 'high', 'urgent'] as const;
const SORT_BY_VALUES = ['title', 'status', 'priority', 'assignee', 'createdAt', 'updatedAt'] as const;

export const createIssueSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200, 'Title must be at most 200 characters'),
  description: z.string().max(20000, 'Description must be at most 20000 characters').optional().default(''),
  status: z.enum(STATUS_VALUES).optional().default('backlog'),
  priority: z.enum(PRIORITY_VALUES).optional().default('none'),
  labels: z.array(z.string()).optional().default([]),
  assignee: z.string().nullable().optional(),
});

export const updateIssueSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200, 'Title must be at most 200 characters').optional(),
  description: z.string().max(20000, 'Description must be at most 20000 characters').optional(),
  status: z.enum(STATUS_VALUES).optional(),
  priority: z.enum(PRIORITY_VALUES).optional(),
  labels: z.array(z.string()).optional(),
  assignee: z.string().nullable().optional(),
});

export const issueQuerySchema = z.object({
  status: z.string().optional(),
  priority: z.string().optional(),
  labels: z.string().optional(),
  assignee: z.string().optional(),
  search: z.string().optional(),
  sortBy: z.enum(SORT_BY_VALUES).optional().default('updatedAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export const createSubtaskSchema = z.object({
  title: z.string().trim().min(1, 'Subtask title is required'),
});

export const updateSubtaskSchema = z.object({
  title: z.string().trim().min(1).optional(),
  done: z.boolean().optional(),
});

export type CreateIssueInput = z.infer<typeof createIssueSchema>;
export type UpdateIssueInput = z.infer<typeof updateIssueSchema>;
export type IssueQueryInput = z.infer<typeof issueQuerySchema>;
