'use server';
/**
 * @fileOverview This file defines a Genkit flow for generating a daily operational briefing for an admin.
 *
 * The flow synthesizes data from various parts of the application (jobs, reports, requests)
 * to create a concise, actionable summary to help a manager prioritize their day.
 *
 * @remarks
 * - generateDailyBriefing - The main function to trigger the briefing flow.
 * - DailyBriefingInput - The input type for the generateDailyBriefing function.
 * - DailyBriefingOutput - The output type for the generateDailyBriefing function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export const DailyBriefingInputSchema = z.object({
  date: z.string().describe("Today's date in ISO format."),
  jobs: z.string().describe('A JSON string of all jobs.'),
  reports: z.string().describe('A JSON string of all inspection reports.'),
  timeOffRequests: z.string().describe('A JSON string of all time-off requests.'),
  expenseReports: z.string().describe('A JSON string of all expense reports.'),
  tasks: z.string().describe('A JSON string of all tasks.'),
  events: z.string().describe('A JSON string of all calendar events.'),
});
export type DailyBriefingInput = z.infer<typeof DailyBriefingInputSchema>;

const BriefingItemSchema = z.object({
  id: z.string().describe('The ID of the source item (e.g., report ID, job ID).'),
  type: z.enum(['report', 'job', 'request', 'task', 'event']).describe('The type of item being referenced.'),
  priority: z.enum(['high', 'medium', 'low']).describe('The priority level of the briefing item.'),
  summary: z.string().describe('A concise summary of the item for the briefing.'),
  link: z.string().describe('A client-side relative URL to the relevant page (e.g., /reports/[id]).'),
});

export const DailyBriefingOutputSchema = z.object({
  attentionItems: z.array(BriefingItemSchema).describe('A list of items that require immediate attention, like failed inspections or new high-priority issues.'),
  todaysAgenda: z.array(BriefingItemSchema).describe("A summary of what's scheduled for today, including active jobs and company events."),
  pendingActions: z.array(BriefingItemSchema).describe('A list of items awaiting administrative action, such as pending time-off or expense requests.'),
});
export type DailyBriefingOutput = z.infer<typeof DailyBriefingOutputSchema>;

export async function generateDailyBriefing(input: DailyBriefingInput): Promise<DailyBriefingOutput> {
  return generateDailyBriefingFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateDailyBriefingPrompt',
  input: {schema: DailyBriefingInputSchema},
  output: {schema: DailyBriefingOutputSchema},
  prompt: `You are an AI assistant for the admin of a fleet management company. Your task is to generate a daily operational briefing based on the provided JSON data. Today's date is {{{date}}}.

Analyze all the data and synthesize it into three categories:

1.  **attentionItems**: Identify the most urgent issues that require immediate attention. This should exclusively be for newly failed inspection reports submitted in the last 48 hours. The summary should be concise, like "Failed inspection for [Asset Name] by [Employee Name]". Set priority to 'high'. The link should be to '/reports/[reportId]'.

2.  **todaysAgenda**: Summarize what's happening today.
    -   Include all jobs that are currently 'active' today. The summary should be "Active Job: [Job Name] for [Client Name]". Set priority to 'medium'. The link should be to '/admin/jobs/[jobId]'.
    -   Include any company events scheduled for today. The summary should be "Event: [Event Title]". Set priority to 'low'. The link should be to '/admin/manage-calendar'.

3.  **pendingActions**: List all items that are awaiting a decision from the administrator.
    -   Include all time-off requests with a 'pending' status. The summary should be "Time-off request from [Employee Name]". Set priority to 'medium'. The link should be to '/admin/manage-requests'.
    -   Include all expense reports with a 'pending' status. The summary should be "Expense report from [Employee Name] for $[Amount]". Set priority to 'low'. The link should be to '/admin/manage-expenses'.
    
Do not include items that are completed, approved, denied, or otherwise resolved. Focus only on actionable, pending, or active items for today.

Here is the data:
-   Jobs: {{{jobs}}}
-   Inspection Reports: {{{reports}}}
-   Time-Off Requests: {{{timeOffRequests}}}
-   Expense Reports: {{{expenseReports}}}
-   Tasks: {{{tasks}}}
-   Calendar Events: {{{events}}}

Provide your response in the structured output format.`,
});

const generateDailyBriefingFlow = ai.defineFlow(
  {
    name: 'generateDailyBriefingFlow',
    inputSchema: DailyBriefingInputSchema,
    outputSchema: DailyBriefingOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
