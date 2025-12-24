
'use server';

import { getJobs, getCalendarEvents, getFleetAssets, getTimeOffRequests, getInspectionReports } from '@/lib/firestoreService';
import { generateDailyBriefing } from '@/ai/flows/generate-daily-briefing';
import type { DailyBriefingOutput } from '@/ai/flows/generate-daily-briefing-schema';
import type { Job, CalendarEvent } from '@/lib/types';
import { getJobStatus } from '@/lib/job-utils';

export interface AdminDashboardData {
  briefing: DailyBriefingOutput | null;
  events: CalendarEvent[];
  jobs: Job[]; // For the calendar
  stats: {
    activeJobs: number;
    totalAssets: number;
    pendingRequests: number;
    failedReports: number;
  };
}

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  // Fetch all data required for the dashboard (AI and non-AI parts)
  const [
    allJobs = [],
    allEvents = [],
    allAssets = [],
    allTimeOffRequests = [],
    allReports = []
  ] = await Promise.all([
    getJobs().catch(() => []),
    getCalendarEvents().catch(() => []),
    getFleetAssets().catch(() => []),
    getTimeOffRequests().catch(() => []),
    getInspectionReports().catch(() => [])
  ]).catch(err => {
    console.error("Critical error fetching dashboard data:", err);
    return [[], [], [], [], []];
  });

  let briefing: DailyBriefingOutput | null = null;
  try {
    // Pass the fetched data directly to the AI flow
    briefing = await generateDailyBriefing({
      jobs: allJobs,
      reports: allReports,
      timeOffRequests: allTimeOffRequests,
      events: allEvents,
      assets: allAssets,
    });
  } catch (error) {
    console.error("Failed to generate AI daily briefing:", error);
    briefing = null; // Ensure briefing is null on failure so the UI can handle it
  }
  
  // Calculate stats after all data is fetched
  const stats = {
    activeJobs: allJobs.filter(j => getJobStatus(j) === 'active').length,
    totalAssets: allAssets.length,
    pendingRequests: allTimeOffRequests.filter(r => r.status === 'pending').length,
    failedReports: allReports.filter(r => r.overallStatus === 'fail').length,
  };

  return {
      briefing,
      events: allEvents,
      jobs: allJobs, // Return all jobs for the calendar component
      stats,
  };
}
