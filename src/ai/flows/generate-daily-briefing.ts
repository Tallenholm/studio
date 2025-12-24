
'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit/zod';

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

const generateBriefingFlow = ai.defineFlow(
  {
    name: 'generateDailyBriefingFlow',
    inputSchema: DailyBriefingInputSchema,
    outputSchema: DailyBriefingOutputSchema,
  },
  async (input) => {
    
    const prompt = `You are an AI assistant for an operations manager at an excavating company. Your task is to create a daily briefing based on the JSON data provided. It is currently ${input.date}.

    Analyze the provided JSON data for jobs, failed inspection reports, pending requests (time off, expenses), pending tasks, and today's events.
    
    Categorize the information into three lists:
    1.  **Urgent Attention**: High-priority items. This should exclusively be for FAILED inspection reports. For each, create a summary like "Failed pre-trip report for [Asset Name] by [Employee Name]." The link should be '/reports/[reportId]'.
    2.  **Today's Agenda**: Things scheduled for today. This includes active jobs and company events. For jobs, summarize as "Job: [Job Name] for [Client Name]." with link '/admin/jobs/[jobId]'. For events, summarize as "Event: [Event Title]." with link '/admin/manage-calendar'.
    3.  **Pending Actions**: Items that require the manager's review and approval. This includes time off requests, expense reports, and assigned tasks that are still pending. Summarize time off as "[Employee Name] requested time off." with link '/admin/manage-requests'. Summarize expenses as "[Employee Name] submitted an expense for [Amount]." with link '/admin/manage-expenses'. Summarize tasks as "Task "[Task Title]" assigned to [Employee Name] is pending." with link '/admin/manage-tasks'.

    If a category has no items, return an empty array for it. Be concise and professional.
    
    DATA:
    - Jobs: ${input.jobs}
    - Reports: ${input.reports}
    - Time Off: ${input.timeOffRequests}
    - Expenses: ${input.expenseReports}
    - Tasks: ${input.tasks}
    - Events: ${input.events}
    `;

    const llmResponse = await ai.generate({
      prompt,
      model: 'gemini-pro',
      output: {
        format: 'json',
        schema: DailyBriefingOutputSchema,
      },
    });

    return llmResponse.output()!;
  }
);


export async function generateDailyBriefing(input: DailyBriefingInput): Promise<DailyBriefingOutput> {
  return generateBriefingFlow(input);
}
