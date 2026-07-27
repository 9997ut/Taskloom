import { z } from 'zod';

export const createCommentSchema = z.object({
  text: z.string().min(1, 'Comment text is required').max(5000, 'Comment must be at most 5000 characters'),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
