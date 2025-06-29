
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
  // Step 1: Fetch all necessary data first, with fallbacks for individual failures.
  const [allJobs, allExpenseReports, allReports, allTimeOffRequests, allTasks, allEvents] = await Promise.all([
    getJobs().catch(() => []),
    getExpenseReports().catch(() => []),
    getInspectionReports().catch(() => []),
    getTimeOffRequests().catch(() => []),
    getTasks().catch(() => []),
    getCalendarEvents().catch(() => []),
  ]);

  let briefing: DailyBriefingOutput | null = null;
  
  // Step 2: Try to generate the briefing in a separate try/catch block.
  try {
    const today = new Date();

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

    briefing = await generateDailyBriefing(briefingInput);

  } catch (error) {
    console.error("Failed to generate AI daily briefing:", error);
    // The 'briefing' variable will remain null, which is the intended behavior on failure.
  }
  
  // Step 3: Always return the fetched data, with or without a successful briefing.
  return {
      briefing,
      jobs: allJobs,
      events: allEvents,
  };
}
