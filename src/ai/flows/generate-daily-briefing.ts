
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { DailyBriefingOutputSchema } from './generate-daily-briefing-schema';
import type { DailyBriefingOutput } from './generate-daily-briefing-schema';
import { getJobs, getInspectionReports, getTimeOffRequests, getExpenseReports, getTasks, getCalendarEvents, getFleetAssets } from '@/lib/firestoreService';

const fetchDashboardDataTool = ai.defineTool(
    {
      name: 'fetchDashboardData',
      description: 'Fetches all necessary data for the daily briefing from the database (jobs, reports, requests, etc.).',
      inputSchema: z.object({}),
      // REMOVED: The z.custom<Type>() was causing the flow to fail.
      // The tool will now return raw data which the LLM is instructed to handle.
    },
    async () => {
        const [
            jobs = [],
            reports = [],
            timeOffRequests = [],
            expenseReports = [],
            tasks = [],
            events = [],
            assets = []
        ] = await Promise.all([
            getJobs(),
            getInspectionReports(),
            getTimeOffRequests(),
            getExpenseReports(),
            getTasks(),
            getCalendarEvents(),
            getFleetAssets(),
        ]).catch((err) => {
            console.error("Error fetching data in fetchDashboardDataTool:", err);
            return [[], [], [], [], [], [], []]; // Return empty arrays on failure
        });
        return { jobs, reports, timeOffRequests, expenseReports, tasks, events, assets };
    }
);


const generateBriefingFlow = ai.defineFlow(
  {
    name: 'generateDailyBriefingFlow',
    inputSchema: z.void(),
    outputSchema: DailyBriefingOutputSchema,
  },
  async () => {
    
    const prompt = `You are an AI assistant for an operations manager at an excavating company. It is currently ${new Date().toDateString()}. Your task is to use the available tool to fetch all operational data and then create a daily briefing.

    Categorize the information into three lists:
    1.  **attentionItems**: High-priority items. This should exclusively be for FAILED inspection reports from the last 2 days. For each, create a summary like "Failed pre-trip report for [Asset Name] by [Employee Name]." The link should be '/admin/reports/[reportId]'.
    2.  **todaysAgenda**: Things scheduled for today. This includes active jobs and company events. For jobs, summarize as "Job: [Job Name] for [Client Name]." with link '/admin/jobs/[jobId]'. For events, summarize as "Event: [Event Title]." with link '/admin/manage-calendar'.
    3.  **pendingActions**: Items that require the manager's review and approval. This includes time off requests, expense reports, and assigned tasks that are still pending. Summarize time off as "[Employee Name] requested time off." with link '/admin/manage-requests'. Summarize expenses as "[Employee Name] submitted an expense for [Amount]." with link '/admin/manage-expenses'. Summarize tasks as "Task "[Task Title]" assigned to [Employee Name] is pending." with link '/admin/manage-tasks'.

    If a category has no items, return an empty array for it. Be concise and professional.
    First, call the fetchDashboardData tool to get all the data. Then, process the data according to the rules above and return the final JSON object.`;

    const llmResponse = await ai.generate({
      prompt,
      model: 'gemini-1.5-flash',
      tools: [fetchDashboardDataTool],
      toolChoice: 'auto',
      output: {
        format: 'json',
        schema: DailyBriefingOutputSchema,
      },
    });

    const output = llmResponse.output();
    if (!output) {
      throw new Error('AI response did not include a valid briefing object.');
    }
    return output;
  }
);


export async function generateDailyBriefing(): Promise<DailyBriefingOutput> {
  return generateBriefingFlow();
}

