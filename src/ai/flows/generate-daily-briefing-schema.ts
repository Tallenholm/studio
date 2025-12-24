
import {z} from 'zod';

const JobSchema = z.object({
    id: z.string(),
    name: z.string(),
    clientName: z.string(),
    jobType: z.string(),
});

const ReportSchema = z.object({
    id: z.string(),
    assetName: z.string(),
    employeeName: z.string(),
});

const RequestSchema = z.object({
    id: z.string(),
    employeeName: z.string(),
});

const ExpenseSchema = z.object({
    id: z.string(),
    employeeName: z.string(),
    amount: z.number(),
});

const TaskSchema = z.object({
    id: z.string(),
    title: z.string(),
    assignedToEmployeeName: z.string(),
});

const EventSchema = z.object({
    id: z.string(),
    title: z.string(),
});


export const DailyBriefingInputSchema = z.object({
  date: z.string().describe("Today's date in ISO format."),
  jobs: z.array(JobSchema).describe('A list of active jobs scheduled for today.'),
  reports: z.array(ReportSchema).describe('A list of inspection reports from the last 2 days that have failed.'),
  timeOffRequests: z.array(RequestSchema).describe('A list of pending time off requests.'),
  expenseReports: z.array(ExpenseSchema).describe('A list of pending expense reports.'),
  tasks: z.array(TaskSchema).describe('A list of pending tasks for all employees.'),
  events: z.array(EventSchema).describe("A list of company events scheduled for today."),
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
