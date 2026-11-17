import { z } from 'zod';

export const CATEGORIES = ['meeting', 'scheduling', 'finance', 'legal', 'hiring', 'general'] as const;
export type Category = (typeof CATEGORIES)[number];

export const UNCERTAINTY_FLAGS = [
  'unknown_sender',
  'missing_context',
  'unclear_intent',
  'authority_unclear',
] as const;
export type UncertaintyFlag = (typeof UNCERTAINTY_FLAGS)[number];

export const isUncertaintyFlag = (value: string): value is UncertaintyFlag =>
  (UNCERTAINTY_FLAGS as readonly string[]).includes(value);

// What we ask the model to return. Unknown categories fall back to "general".
export const rawClassificationSchema = z.object({
  responsibility: z.enum(['assistant', 'client', 'none']),
  confidence: z.number().min(0).max(1),
  uncertainty: z.array(z.string()).default([]),
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
  uncertainty: UncertaintyFlag[];
  reason: string;
  summary: string;
  category: Category;
  actionRequired: boolean;
  waitingForReply: boolean;
  extractedDates: { label: string; date: Date; kind: 'meeting' | 'deadline' | 'other' }[];
};