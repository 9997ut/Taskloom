import { z } from 'zod';

export const createLabelSchema = z.object({
  name: z.string().trim().min(1, 'Label name is required'),
  color: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i, 'Color must be a valid hex value (e.g., #FF5733)'),
});

export const updateLabelSchema = z.object({
  name: z.string().trim().min(1, 'Label name is required').optional(),
  color: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i, 'Color must be a valid hex value (e.g., #FF5733)')
    .optional(),
});

export type CreateLabelInput = z.infer<typeof createLabelSchema>;
export type UpdateLabelInput = z.infer<typeof updateLabelSchema>;
