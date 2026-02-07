
'use server';

import { getCalendarEvents, getTasksForUser, getReportsForUser, getJobsForUser } from '@/lib/firestoreService';
import type { Job, CalendarEvent, Task, InspectionReport } from '@/lib/types';

export interface EmployeeDashboardData {
  jobs: Job[];
  events: CalendarEvent[];
  tasks: Task[];
  reports: InspectionReport[];
}

/**
 * A Server Action to fetch all necessary data for the employee dashboard,
 * now filtered specifically for the given user on the server.
 */
export async function getEmployeeDashboardData({ userId }: { userId: string }): Promise<EmployeeDashboardData> {
  const [
    userJobs = [],
    allEvents = [],
    userTasks = [],
    userReports = []
  ] = await Promise.all([
    getJobsForUser(userId),
    getCalendarEvents(),
    getTasksForUser(userId),
    getReportsForUser(userId),
  ]).catch(err => {
    console.error("Failed to fetch dashboard data for employee:", err);
    return [[], [], [], []];
  });

  // Data is now efficiently pre-filtered on the server.
  return {
    jobs: userJobs,
    events: allEvents,
    tasks: userTasks,
    reports: userReports,
  };
}
