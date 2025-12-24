
import {z} from 'zod';
import type { Job, InspectionReport, TimeOffRequest, CalendarEvent, FleetAsset } from '@/lib/types';

const BriefingItemSchema = z.object({
    id: z.string().describe('A unique ID for the item.'),
    type: z.enum(['report', 'job', 'request', 'event']).describe('The type of briefing item.'),
    summary: z.string().describe('A concise, one-sentence summary of the item for the user.'),
    link: z.string().describe('The direct URL to view the item in the application.'),
});

export const DailyBriefingOutputSchema = z.object({
  attentionItems: z.array(BriefingItemSchema).describe('Items that are critical and require immediate attention, such as failed inspections.'),
  todaysAgenda: z.array(BriefingItemSchema).describe("Items on today's schedule, such as active jobs or company events."),
  pendingActions: z.array(BriefingItemSchema).describe('Items that are awaiting review or approval, like time off requests.'),
});

export type DailyBriefingOutput = z.infer<typeof DailyBriefingOutputSchema>;

// Define the input schema for the AI flow
export const DailyBriefingInputSchema = z.object({
  jobs: z.array(z.any()),
  reports: z.array(z.any()),
  timeOffRequests: z.array(z.any()),
  events: z.array(z.any()),
  assets: z.array(z.any()),
});

export type DailyBriefingInput = z.infer<typeof DailyBriefingInputSchema>;
