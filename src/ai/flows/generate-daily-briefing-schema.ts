
import {z} from 'zod';

export const DailyBriefingInputSchema = z.object({
  date: z.string().describe("Today's date in ISO format."),
  jobs: z.string().describe('A JSON string of active jobs scheduled for today.'),
  reports: z.string().describe('A JSON string of inspection reports from the last 2 days that have failed.'),
  timeOffRequests: z.string().describe('A JSON string of pending time off requests.'),
  expenseReports: z.string().describe('A JSON string of pending expense reports.'),
  tasks: z.string().describe('A JSON string of pending tasks for all employees.'),
  events: z.string().describe("A JSON string of company events scheduled for today."),
});

export type DailyBriefingInput = z.infer<typeof DailyBriefingInputSchema>;

const BriefingItemSchema = z.object({
    id: z.string().describe('A unique ID for the item.'),
    type: z.enum(['report', 'job', 'request', 'task', 'event']).describe('The type of briefing item.'),
    summary: z.string().describe('A concise, one-sentence summary of the item for the user.'),
    link: z.string().describe('The direct URL to view the item in the application.'),
});

export const DailyBriefingOutputSchema = z.object({
  attentionItems: z.array(BriefingItemSchema).describe('Items that are critical and require immediate attention, such as failed inspections.'),
  todaysAgenda: z.array(BriefingItemSchema).describe("Items on today's schedule, such as active jobs or company events."),
  pendingActions: z.array(BriefingItemSchema).describe('Items that are awaiting review or approval, like time off or expense requests.'),
});

export type DailyBriefingOutput = z.infer<typeof DailyBriefingOutputSchema>;
