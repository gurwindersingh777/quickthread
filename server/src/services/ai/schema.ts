import { z } from 'zod';

export const CATEGORIES = ['meeting', 'scheduling', 'finance', 'legal', 'hiring', 'general'] as const;
export type Category = (typeof CATEGORIES)[number];

// What we ask the model to return. Unknown categories fall back to "general".
export const rawClassificationSchema = z.object({
  responsibility: z.enum(['assistant', 'client', 'none']),
  confidence: z.number().min(0).max(1),
  reason: z.string().min(1),
  summary: z.string().min(1),
  category: z.enum(CATEGORIES).catch('general'),
  actionRequired: z.boolean(),
  waitingForReply: z.boolean(),
  dates: z
    .array(
      z.object({
        label: z.string(),
        iso: z.string(),
        kind: z.enum(['meeting', 'deadline', 'other']).catch('other'),
      }),
    )
    .default([]),
});

// What the rest of the app works with
export type Classification = {
  responsibility: 'assistant' | 'client' | 'none';
  confidence: number;
  reason: string;
  summary: string;
  category: Category;
  actionRequired: boolean;
  waitingForReply: boolean;
  extractedDates: { label: string; date: Date; kind: 'meeting' | 'deadline' | 'other' }[];
};