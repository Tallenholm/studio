
'use server';

import { getJobs, getExpenseReports, getInspectionReports, getTimeOffRequests, getTasks, getCalendarEvents } from '@/lib/firestoreService';
import { generateDailyBriefing, type DailyBriefingOutput } from '@/ai/flows/generate-daily-briefing';
import type { Job, CalendarEvent } from '@/lib/types';
import { isWithinInterval, subDays, isToday, parseISO } from 'date-fns';
import { getJobStatus } from '@/lib/job-utils';

export interface AdminDashboardData {
  briefing: DailyBriefingOutput | null;
  jobs: Job[];
  events: CalendarEvent[];
}

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  try {
    const today = new Date();
    // Fetch all data from Firestore.
    const [allJobs, allExpenseReports, allReports, allTimeOffRequests, allTasks, allEvents] = await Promise.all([
        getJobs(),
        getExpenseReports(),
        getInspectionReports(),
        getTimeOffRequests(),
        getTasks(),
        getCalendarEvents(),
    ]);

    // Pre-filter data on the server before sending it to the AI.
    const attentionReports = allReports.filter(r => 
        r.overallStatus === 'fail' && 
        isWithinInterval(parseISO(r.date), { start: subDays(today, 2), end: today })
    );

    const activeJobs = allJobs.filter(j => getJobStatus(j) === 'active');
    
    const todaysEvents = allEvents.filter(e => isToday(parseISO(e.date)));

    const pendingTimeOff = allTimeOffRequests.filter(r => r.status === 'pending');
    
    const pendingExpenses = allExpenseReports.filter(r => r.status === 'pending');

    const pendingTasks = allTasks.filter(t => t.status === 'pending');

    // Create a much smaller, more focused input for the AI.
    const briefingInput = {
        date: today.toISOString(),
        jobs: JSON.stringify(activeJobs),
        reports: JSON.stringify(attentionReports),
        timeOffRequests: JSON.stringify(pendingTimeOff),
        expenseReports: JSON.stringify(pendingExpenses),
        tasks: JSON.stringify(pendingTasks),
        events: JSON.stringify(todaysEvents),
    };

    const briefing = await generateDailyBriefing(briefingInput);

    // Return all jobs and events for the calendar display, not just the filtered ones for the AI.
    return {
        briefing,
        jobs: allJobs,
        events: allEvents,
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
