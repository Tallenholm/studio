
'use server';

import { getJobs, getCalendarEvents, getFleetAssets, getTimeOffRequests, getInspectionReports } from '@/lib/firestoreService';
import { generateDailyBriefing } from '@/ai/flows/generate-daily-briefing';
import type { DailyBriefingOutput, BriefingData } from '@/ai/flows/generate-daily-briefing-schema';
import type { Job, CalendarEvent } from '@/lib/types';
import { getJobStatus } from '@/lib/job-utils';
import { isToday, isAfter, subDays, parseISO, format } from 'date-fns';

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
    // --- Manually prepare data for the AI ---
    const twoDaysAgo = subDays(new Date(), 2);
    
    const attentionItems: BriefingData['attentionItems'] = allReports
      .filter(r => r.overallStatus === 'fail' && isAfter(parseISO(r.date), twoDaysAgo))
      .map(r => {
        const assetVin = r.truckVin || r.trailerVin || r.heavyEquipmentVin || 'Unknown';
        const assetName = allAssets.find(a => a.vin === assetVin)?.name || assetVin;
        return {
          id: r.id,
          type: 'report',
          title: `Failed report for ${assetName}`,
          details: `By ${r.employeeName}`,
          link: `/admin/reports/${r.id}`
        };
      });

    const todaysAgenda: BriefingData['todaysAgenda'] = [
      ...allJobs
        .filter(j => getJobStatus(j) === 'active')
        .map(j => ({
          id: j.id,
          type: 'job' as const,
          title: `Job: ${j.name}`,
          details: `For ${j.clientName}`,
          link: `/admin/jobs/${j.id}`
        })),
      ...allEvents
        .filter(e => isToday(parseISO(e.date)))
        .map(e => ({
          id: e.id,
          type: 'event' as const,
          title: `Event: ${e.title}`,
          details: e.description,
          link: '/admin/manage-calendar'
        }))
    ];
    
    const pendingActions: BriefingData['pendingActions'] = allTimeOffRequests
      .filter(r => r.status === 'pending')
      .map(r => ({
        id: r.id,
        type: 'request',
        title: `${r.employeeName} requested time off`,
        details: `From ${format(parseISO(r.startDate), 'MMM d')} to ${format(parseISO(r.endDate), 'MMM d')}`,
        link: '/admin/manage-requests'
      }));
      
    // --- Call the simplified AI flow ---
    if (attentionItems.length > 0 || todaysAgenda.length > 0 || pendingActions.length > 0) {
        briefing = await generateDailyBriefing({
            attentionItems,
            todaysAgenda,
            pendingActions,
        });
    } else {
        briefing = { attentionItems: [], todaysAgenda: [], pendingActions: [] };
    }

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
