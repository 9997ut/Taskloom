import { z } from 'zod';

export const createSavedViewSchema = z.object({
  name: z.string().trim().min(1, 'View name is required'),
  filters: z.object({
    status: z.array(z.string()).optional(),
    priority: z.array(z.string()).optional(),
    labels: z.array(z.string()).optional(),
    assignee: z.string().optional(),
    search: z.string().optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
  }),
});

export type CreateSavedViewInput = z.infer<typeof createSavedViewSchema>;
