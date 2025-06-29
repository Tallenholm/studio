
'use server';

import { getJobs, getExpenseReports, getInspectionReports, getTimeOffRequests, getTasks, getCalendarEvents } from '@/lib/firestoreService';
import { generateDailyBriefing, type DailyBriefingOutput } from '@/ai/flows/generate-daily-briefing';
import type { Job, CalendarEvent } from '@/lib/types';

export interface AdminDashboardData {
  briefing: DailyBriefingOutput | null;
  jobs: Job[];
  events: CalendarEvent[];
}

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  try {
    // All data is now fetched from Firestore on the server.
    const [jobs, expenseReports, reports, timeOffRequests, tasks, events] = await Promise.all([
        getJobs(),
        getExpenseReports(),
        getInspectionReports(),
        getTimeOffRequests(),
        getTasks(),
        getCalendarEvents(),
    ]);

    const briefingInput = {
        date: new Date().toISOString(),
        jobs: JSON.stringify(jobs),
        expenseReports: JSON.stringify(expenseReports),
        reports: JSON.stringify(reports),
        timeOffRequests: JSON.stringify(timeOffRequests),
        tasks: JSON.stringify(tasks),
        events: JSON.stringify(events),
    };

    const briefing = await generateDailyBriefing(briefingInput);

    return {
        briefing,
        jobs,
        events,
    };
  } catch (error) {
    console.error("Failed to get admin dashboard data:", error);
    // In case of AI failure, return the data needed for the page to render without the briefing.
    const jobs = await getJobs().catch(() => []);
    const events = await getCalendarEvents().catch(() => []);
    return {
      briefing: null,
      jobs: jobs,
      events: events,
    };
  }
}
