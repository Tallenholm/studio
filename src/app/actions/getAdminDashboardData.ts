
'use server';

import { loadCalendarEvents, loadInspectionReports, loadTimeOffRequests, loadExpenseReports, loadTasks } from '@/lib/localStorageService';
import { getJobs } from '@/lib/firestoreService';
import { generateDailyBriefing, type DailyBriefingOutput } from '@/ai/flows/generate-daily-briefing';
import type { CalendarEvent, Job } from '@/lib/types';

export interface AdminDashboardData {
  briefing: DailyBriefingOutput | null;
  events: CalendarEvent[];
  jobs: Job[];
}

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  try {
    const jobs = await getJobs();
    const reports = loadInspectionReports();
    const timeOffRequests = loadTimeOffRequests();
    const expenseReports = loadExpenseReports();
    const tasks = loadTasks();
    const events = loadCalendarEvents();

    const briefingInput = {
        date: new Date().toISOString(),
        jobs: JSON.stringify(jobs),
        reports: JSON.stringify(reports),
        timeOffRequests: JSON.stringify(timeOffRequests),
        expenseReports: JSON.stringify(expenseReports),
        tasks: JSON.stringify(tasks),
        events: JSON.stringify(events),
    };

    const briefing = await generateDailyBriefing(briefingInput);

    return {
        briefing,
        events,
        jobs,
    };
  } catch (error) {
    console.error("Failed to get admin dashboard data:", error);
    // Return the essential data for the page to render, even if AI fails
    const jobs = await getJobs().catch(() => []); // Fallback for jobs
    return {
      briefing: null,
      events: loadCalendarEvents(),
      jobs: jobs,
    };
  }
}
