
'use server';

import { getJobs, getExpenseReports, getInspectionReports, getTimeOffRequests, getTasks, getCalendarEvents, getFleetAssets } from '@/lib/firestoreService';
import { generateDailyBriefing } from '@/ai/flows/generate-daily-briefing';
import type { DailyBriefingOutput, DailyBriefingInput } from '@/ai/flows/generate-daily-briefing-schema';
import type { Job, CalendarEvent } from '@/lib/types';
import { isWithinInterval, subDays, isToday, parseISO } from 'date-fns';
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
    const attentionReports = allReports
      .filter(r => 
        r.overallStatus === 'fail' && 
        isWithinInterval(parseISO(r.date), { start: subDays(today, 2), end: today })
      )
      .map(report => {
        const vin = report.truckVin || report.trailerVin || report.heavyEquipmentVin;
        const asset = allAssets.find(a => a.vin === vin);
        return {
          id: report.id,
          assetName: asset?.name || 'Unknown Asset',
          employeeName: report.employeeName || 'Unknown Employee',
        };
      });

    const activeJobs = allJobs.filter(j => getJobStatus(j) === 'active');
    const todaysEvents = allEvents.filter(e => isToday(parseISO(e.date)));
    const pendingTimeOff = allTimeOffRequests.filter(r => r.status === 'pending');
    const pendingExpenses = allExpenseReports.filter(r => r.status === 'pending');
    const pendingTasks = allTasks.filter(t => t.status === 'pending');

    const briefingInput: DailyBriefingInput = {
        date: today.toISOString(),
        jobs: activeJobs.map(j => ({id: j.id, name: j.name, clientName: j.clientName, jobType: j.jobType})),
        reports: attentionReports,
        timeOffRequests: pendingTimeOff.map(r => ({id: r.id, employeeName: r.employeeName})),
        expenseReports: pendingExpenses.map(r => ({id: r.id, employeeName: r.employeeName, amount: r.amount})),
        tasks: pendingTasks.map(t => ({id: t.id, title: t.title, assignedToEmployeeName: t.assignedToEmployeeName})),
        events: todaysEvents.map(e => ({id: e.id, title: e.title})),
    };

    briefing = await generateDailyBriefing(briefingInput);

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
