
'use server';

import { getJobs, getExpenseReports } from '@/lib/firestoreService';
import { generateDailyBriefing, type DailyBriefingOutput } from '@/ai/flows/generate-daily-briefing';
import type { Job } from '@/lib/types';
import { loadInspectionReports, loadTimeOffRequests, loadTasks, loadCalendarEvents } from '@/lib/localStorageService';

export interface AdminDashboardData {
  briefing: DailyBriefingOutput | null;
  jobs: Job[];
}

// NOTE: This server action currently uses a mix of Firestore and localStorage.
// As more features are migrated to Firestore, the localStorage calls will be replaced.
export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  try {
    const jobs = await getJobs();
    const expenseReports = await getExpenseReports();
    
    // Data still on client-side localStorage. This is a temporary pattern during migration.
    const reports = loadInspectionReports();
    const timeOffRequests = loadTimeOffRequests();
    const tasks = loadTasks();
    const events = loadCalendarEvents();

    const briefingInput = {
        date: new Date().toISOString(),
        jobs: JSON.stringify(jobs),
        expenseReports: JSON.stringify(expenseReports),
        // The following are still from localStorage and will be replaced
        reports: JSON.stringify(reports),
        timeOffRequests: JSON.stringify(timeOffRequests),
        tasks: JSON.stringify(tasks),
        events: JSON.stringify(events),
    };

    const briefing = await generateDailyBriefing(briefingInput);

    return {
        briefing,
        jobs,
    };
  } catch (error) {
    console.error("Failed to get admin dashboard data:", error);
    // In case of AI failure, return the data needed for the page to render without the briefing.
    const jobs = await getJobs().catch(() => []);
    return {
      briefing: null,
      jobs: jobs,
    };
  }
}
