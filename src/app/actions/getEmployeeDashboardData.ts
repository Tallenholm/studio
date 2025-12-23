'use server';

import { getJobs, getCalendarEvents, getTasks, getInspectionReports } from '@/lib/firestoreService';
import type { Job, CalendarEvent, Task, InspectionReport } from '@/lib/types';

export interface EmployeeDashboardData {
  jobs: Job[];
  events: CalendarEvent[];
  tasks: Task[];
  reports: InspectionReport[];
}

/**
 * A Server Action to fetch all necessary data for the employee dashboard.
 * It now fetches all data and relies on the client to filter for the current user.
 */
export async function getEmployeeDashboardData(): Promise<EmployeeDashboardData> {
  const [
    allJobs = [],
    allEvents = [],
    allTasks = [],
    allReports = []
  ] = await Promise.all([
    getJobs(),
    getCalendarEvents(),
    getTasks(),
    getInspectionReports(),
  ]).catch(err => {
    console.error("Failed to fetch all dashboard data for employee:", err);
    return [[], [], [], []];
  });

  // Data is no longer pre-filtered on the server.
  // The client component will filter tasks and reports based on the logged-in user.
  return {
    jobs: allJobs,
    events: allEvents,
    tasks: allTasks,
    reports: allReports,
  };
}
