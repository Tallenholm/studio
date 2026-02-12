

'use server';

import { 
  getCalendarEvents, 
  getFleetAssets, 
  getInspectionReportsInDateRange,
  getPendingTimeOffRequests,
  getActiveAndUpcomingJobs
} from '@/lib/firestoreService';
import { generateDailyBriefing } from '@/ai/flows/generate-daily-briefing';
import type { DailyBriefingOutput, BriefingData } from '@/ai/flows/generate-daily-briefing-schema';
import type { Job, CalendarEvent, TimeOffRequest, InspectionReport, FleetAsset } from '@/lib/types';
import { getJobStatus } from '@/lib/job-utils';
import { isToday, isAfter, subDays, parseISO, format } from 'date-fns';

export interface AdminDashboardData {
  briefing: DailyBriefingOutput | null;
  jobs: Job[];
  events: CalendarEvent[];
  assets: FleetAsset[];
  pendingTimeOffRequests: TimeOffRequest[];
  recentFailedReports: InspectionReport[];
}

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
    const today = new Date();
    const twoDaysAgo = subDays(today, 2);
    const thirtyDaysAgo = subDays(today, 30);
    const thirtyDaysAgoStr = format(thirtyDaysAgo, 'yyyy-MM-dd');
    const todayStr = format(today, 'yyyy-MM-dd');

    const [
        activeAndUpcomingJobs = [],
        allEvents = [],
        allAssets = [],
        pendingTimeOffRequests = [],
        recentFailedReports = [],
    ] = await Promise.all([
        getActiveAndUpcomingJobs(),
        getCalendarEvents(),
        getFleetAssets(),
        getPendingTimeOffRequests(),
        getInspectionReportsInDateRange(thirtyDaysAgoStr, todayStr, 'fail'),
    ]).catch(err => {
        console.error("Critical error fetching dashboard data:", err);
        return [[], [], [], [], []];
    });
  
  // Create a VIN-to-name map for efficient lookups.
  const assetVinMap = new Map<string, string>();
  for (const asset of allAssets) {
    if (asset.vin) {
      assetVinMap.set(asset.vin, asset.name);
    }
  }

  let briefing: DailyBriefingOutput | null = null;
  try {
    const attentionItems: BriefingData['attentionItems'] = recentFailedReports
      .filter(r => isAfter(parseISO(r.date), twoDaysAgo))
      .map(r => {
        const assetVin = r.truckVin || r.trailerVin || r.heavyEquipmentVin || 'Unknown';
        // Use the efficient map lookup instead of a slow .find() in a loop.
        const assetName = assetVinMap.get(assetVin) || assetVin;
        return {
          id: r.id,
          type: 'report',
          title: `Failed report for ${assetName}`,
          details: `By ${r.employeeName}`,
          link: `/reports/${r.id}`
        };
      });

    const todaysAgenda: BriefingData['todaysAgenda'] = [
      ...activeAndUpcomingJobs
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
    
    const pendingActions: BriefingData['pendingActions'] = pendingTimeOffRequests
      .map(r => ({
        id: r.id,
        type: 'request',
        title: `${r.employeeName} requested time off`,
        details: `From ${format(parseISO(r.startDate), 'MMM d')} to ${format(parseISO(r.endDate), 'MMM d')}`,
        link: '/admin/manage-requests'
      }));
      
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
    briefing = null;
  }
  
  return {
      briefing,
      events: allEvents,
      jobs: activeAndUpcomingJobs,
      assets: allAssets,
      pendingTimeOffRequests: pendingTimeOffRequests,
      recentFailedReports: recentFailedReports,
  };
}
