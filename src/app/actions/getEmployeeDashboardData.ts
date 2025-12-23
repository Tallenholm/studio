
'use server';

import { getJobs, getCalendarEvents, getTasks, getInspectionReports } from '@/lib/firestoreService';
import type { Job, CalendarEvent, Task, InspectionReport, User } from '@/lib/types';

export interface EmployeeDashboardData {
  jobs: Job[];
  events: CalendarEvent[];
  tasks: Task[];
  reports: InspectionReport[];
}

/**
 * A Server Action to fetch all necessary data for the employee dashboard.
 */
export async function getEmployeeDashboardData(user: User): Promise<EmployeeDashboardData> {
  if (!user) {
    return { jobs: [], events: [], tasks: [], reports: [] };
  }

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

  const employeeTasks = allTasks.filter(t => t.assignedToEmployeeId === user.uid);
  const employeeReports = allReports.filter(r => r.employeeId === user.uid);

  return {
    jobs: allJobs, // Jobs are filtered client-side based on assignment
    events: allEvents,
    tasks: employeeTasks,
    reports: employeeReports,
  };
}
