
'use server';

import { getJobs, getExpenseReports, getInspectionReports, getTimeOffRequests, getTasks, getCalendarEvents, getFleetAssets } from '@/lib/firestoreService';
// import { generateDailyBriefing, type DailyBriefingOutput } from '@/ai/flows/generate-daily-briefing';
import type { Job, CalendarEvent } from '@/lib/types';
import { isWithinInterval, subDays, isToday, parseISO } from 'date-fns';
import { getJobStatus } from '@/lib/job-utils';

// Mock type for DailyBriefingOutput
type DailyBriefingOutput = {
  attentionItems: any[];
  todaysAgenda: any[];
  pendingActions: any[];
};

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
  // Fetch all data in parallel for maximum efficiency
  const [
    allJobs,
    allExpenseReports,
    allReports,
    allTimeOffRequests,
    allTasks,
    allEvents,
    allAssets
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
    // On a major failure, return empty arrays to prevent the dashboard from crashing.
    return [[], [], [], [], [], [], []] as [Job[], any[], any[], any[], any[], CalendarEvent[], any[]];
  });

  const today = new Date();
  let briefing: DailyBriefingOutput | null = null;
  
  try {
    // AI feature disabled
    // const attentionReports = allReports
    //   .filter(r => 
    //     r.overallStatus === 'fail' && 
    //     isWithinInterval(parseISO(r.date), { start: subDays(today, 2), end: today })
    //   )
    //   .map(report => {
    //     const vin = report.truckVin || report.trailerVin || report.heavyEquipmentVin;
    //     const asset = allAssets.find(a => a.vin === vin);
    //     return {
    //       ...report,
    //       assetName: asset?.name || 'Unknown Asset',
    //     };
    //   });

    // const activeJobs = allJobs.filter(j => getJobStatus(j) === 'active');
    // const todaysEvents = allEvents.filter(e => isToday(parseISO(e.date)));
    // const pendingTimeOff = allTimeOffRequests.filter(r => r.status === 'pending');
    // const pendingExpenses = allExpenseReports.filter(r => r.status === 'pending');
    // const pendingTasks = allTasks.filter(t => t.status === 'pending');

    // const briefingInput = {
    //     date: today.toISOString(),
    //     jobs: JSON.stringify(activeJobs.map(j => ({id: j.id, name: j.name, clientName: j.clientName, jobType: j.jobType}))),
    //     reports: JSON.stringify(attentionReports.map(r => ({id: r.id, assetName: r.assetName, employeeName: r.employeeName}))),
    //     timeOffRequests: JSON.stringify(pendingTimeOff.map(r => ({id: r.id, employeeName: r.employeeName}))),
    //     expenseReports: JSON.stringify(pendingExpenses.map(r => ({id: r.id, employeeName: r.employeeName, amount: r.amount}))),
    //     tasks: JSON.stringify(pendingTasks.map(t => ({id: t.id, title: t.title, assignedToEmployeeName: t.assignedToEmployeeName}))),
    //     events: JSON.stringify(todaysEvents.map(e => ({id: e.id, title: e.title}))),
    // };

    // briefing = await generateDailyBriefing(briefingInput);
    briefing = null;

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
