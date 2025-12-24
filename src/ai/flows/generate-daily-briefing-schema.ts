
import { z } from 'zod';

const BriefingItemSchema = z.object({
  id: z.string(),
  type: z.enum(['report', 'job', 'request', 'event']),
  title: z.string(),
  details: z.string(),
  link: z.string(),
});

export const BriefingDataSchema = z.object({
  attentionItems: z.array(BriefingItemSchema),
  todaysAgenda: z.array(BriefingItemSchema),
  pendingActions: z.array(BriefingItemSchema),
});

export type BriefingData = z.infer<typeof BriefingDataSchema>;

const AiBriefingItemSchema = z.object({
    id: z.string().describe('The unique ID of the original item.'),
    summary: z.string().describe('A concise, one-sentence summary of the item for the user.'),
    link: z.string().describe('The direct URL to view the item in the application.'),
});

export const DailyBriefingOutputSchema = z.object({
  attentionItems: z.array(AiBriefingItemSchema).describe('Items that are critical and require immediate attention.'),
  todaysAgenda: z.array(AiBriefingItemSchema).describe("Items on today's schedule."),
  pendingActions: z.array(AiBriefingItemSchema).describe('Items that are awaiting review or approval.'),
});

export type DailyBriefingOutput = z.infer<typeof DailyBriefingOutputSchema>;
