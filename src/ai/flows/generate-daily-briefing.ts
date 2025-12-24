
'use server';

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import { DailyBriefingInputSchema, DailyBriefingOutputSchema } from './generate-daily-briefing-schema';
import type { DailyBriefingInput, DailyBriefingOutput } from './generate-daily-briefing-schema';


const generateBriefingFlow = ai.defineFlow(
  {
    name: 'generateDailyBriefingFlow',
    inputSchema: DailyBriefingInputSchema,
    outputSchema: DailyBriefingOutputSchema,
  },
  async (input) => {
    
    const prompt = `You are an AI assistant for an operations manager at an excavating company. Your task is to create a daily briefing based on the JSON data provided. It is currently ${new Date(input.date).toDateString()}.

    Analyze the provided JSON data for jobs, failed inspection reports, pending requests (time off, expenses), pending tasks, and today's events.
    
    Categorize the information into three lists:
    1.  **attentionItems**: High-priority items. This should exclusively be for FAILED inspection reports. For each, create a summary like "Failed pre-trip report for [Asset Name] by [Employee Name]." The link should be '/reports/[reportId]'.
    2.  **todaysAgenda**: Things scheduled for today. This includes active jobs and company events. For jobs, summarize as "Job: [Job Name] for [Client Name]." with link '/admin/jobs/[jobId]'. For events, summarize as "Event: [Event Title]." with link '/admin/manage-calendar'.
    3.  **pendingActions**: Items that require the manager's review and approval. This includes time off requests, expense reports, and assigned tasks that are still pending. Summarize time off as "[Employee Name] requested time off." with link '/admin/manage-requests'. Summarize expenses as "[Employee Name] submitted an expense for [Amount]." with link '/admin/manage-expenses'. Summarize tasks as "Task "[Task Title]" assigned to [Employee Name] is pending." with link '/admin/manage-tasks'.

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
      model: 'gemini-1.5-flash',
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
