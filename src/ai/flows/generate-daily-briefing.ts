
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { DailyBriefingOutputSchema } from './generate-daily-briefing-schema';
import type { DailyBriefingOutput } from './generate-daily-briefing-schema';
import { getJobs, getInspectionReports, getTimeOffRequests, getExpenseReports, getTasks, getCalendarEvents, getFleetAssets } from '@/lib/firestoreService';
import type { Job, CalendarEvent, Task, TimeOffRequest, ExpenseReport, InspectionReport, FleetAsset } from '@/lib/types';
import { isWithinInterval, subDays, isToday, parseISO, getDay } from 'date-fns';
import { getJobStatus } from '@/lib/job-utils';


const fetchDashboardDataTool = ai.defineTool(
    {
      name: 'fetchDashboardData',
      description: 'Fetches all necessary data for the daily briefing from the database.',
      inputSchema: z.object({}),
      outputSchema: z.object({
        jobs: z.array(z.custom<Job>()),
        reports: z.array(z.custom<InspectionReport>()),
        timeOffRequests: z.array(z.custom<TimeOffRequest>()),
        expenseReports: z.array(z.custom<ExpenseReport>()),
        tasks: z.array(z.custom<Task>()),
        events: z.array(z.custom<CalendarEvent>()),
        assets: z.array(z.custom<FleetAsset>()),
      }),
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
        ]);
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

    return llmResponse.output()!;
  }
);


export async function generateDailyBriefing(): Promise<DailyBriefingOutput> {
  return generateBriefingFlow();
}
