
'use server';

import { getJobs, getExpenseReports, getInspectionReports, getTimeOffRequests, getTasks, getCalendarEvents, getFleetAssets } from '@/lib/firestoreService';
import { generateDailyBriefing, type DailyBriefingOutput } from '@/ai/flows/generate-daily-briefing';
import type { Job, CalendarEvent } from '@/lib/types';
import { isWithinInterval, subDays, isToday, parseISO } from 'date-fns';
import { getJobStatus } from '@/lib/job-utils';

export interface AdminDashboardData {
  briefing: DailyBriefingOutput | null;
  jobs: Job[];
  events: CalendarEvent[];
  stats: {
    activeJobs: number;
    totalAssets: number;
    pendingRequests: number;
    failedReports: number;
  };
}

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  let briefing: DailyBriefingOutput | null = null;
  
  const [
    allJobs = [],
    allExpenseReports = [],
    allReports = [],
    allTimeOffRequests = [],
    allTasks = [],
    allEvents = [],
    allAssets = []
  ] = await Promise.all([
    getJobs().catch(() => []),
    getExpenseReports().catch(() => []),
    getInspectionReports().catch(() => []),
    getTimeOffRequests().catch(() => []),
    getTasks().catch(() => []),
    getCalendarEvents().catch(() => []),
    getFleetAssets().catch(() => []),
  ]).catch(err => {
    console.error("Critical error fetching dashboard data:", err);
    return [[], [], [], [], [], [], []]; // Return empty arrays on major failure
  });

  const today = new Date();
  
  try {
    const attentionReports = allReports
      .filter(r => 
        r.overallStatus === 'fail' && 
        isWithinInterval(parseISO(r.date), { start: subDays(today, 2), end: today })
      )
      .map(report => {
        const vin = report.truckVin || report.trailerVin || report.heavyEquipmentVin;
        const asset = allAssets.find(a => a.vin === vin);
        return {
          ...report,
          assetName: asset?.name || 'Unknown Asset',
        };
      });

    const activeJobs = allJobs.filter(j => getJobStatus(j) === 'active');
    const todaysEvents = allEvents.filter(e => isToday(parseISO(e.date)));
    const pendingTimeOff = allTimeOffRequests.filter(r => r.status === 'pending');
    const pendingExpenses = allExpenseReports.filter(r => r.status === 'pending');
    const pendingTasks = allTasks.filter(t => t.status === 'pending');

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
    briefing = null;
  }
  
  const stats = {
    activeJobs: allJobs.filter(j => getJobStatus(j) === 'active').length,
    totalAssets: allAssets.length,
    pendingRequests: allTimeOffRequests.filter(r => r.status === 'pending').length,
    failedReports: allReports.filter(r => r.overallStatus === 'fail').length,
  };

  return {
      briefing,
      jobs: allJobs,
      events: allEvents,
      stats,
  };
}
