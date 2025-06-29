
'use server';

import { getJobs } from '@/lib/firestoreService';
import { generateDailyBriefing, type DailyBriefingOutput } from '@/ai/flows/generate-daily-briefing';
import type { CalendarEvent, Job } from '@/lib/types';

export interface AdminDashboardData {
  briefing: DailyBriefingOutput | null;
  events: CalendarEvent[];
  jobs: Job[];
}

export async function getAdminDashboardData(
  stringifiedReports: string,
  stringifiedTimeOffRequests: string,
  stringifiedExpenseReports: string,
  stringifiedTasks: string,
  stringifiedEvents: string
): Promise<AdminDashboardData> {
  try {
    const jobs = await getJobs();
    
    // The events are needed for the calendar on the page, so we parse them here to return.
    const events: CalendarEvent[] = JSON.parse(stringifiedEvents);

    const briefingInput = {
        date: new Date().toISOString(),
        jobs: JSON.stringify(jobs),
        reports: stringifiedReports,
        timeOffRequests: stringifiedTimeOffRequests,
        expenseReports: stringifiedExpenseReports,
        tasks: stringifiedTasks,
        events: stringifiedEvents,
    };

    const briefing = await generateDailyBriefing(briefingInput);

    return {
        briefing,
        events,
        jobs,
    };
  } catch (error) {
    console.error("Failed to get admin dashboard data:", error);
    // In case of AI failure, return the data needed for the page to render without the briefing.
    const jobs = await getJobs().catch(() => []);
    const events: CalendarEvent[] = JSON.parse(stringifiedEvents);
    return {
      briefing: null,
      events: events,
      jobs: jobs,
    };
  }
}
