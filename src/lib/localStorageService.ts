
import type { InspectionReport, FleetAsset, User, ClockState, CalendarEvent, TimeOffRequest, NotificationMessage, Violation } from './types';

const FLEET_ASSETS_KEY = 'fleetCheckAssets';
const REPORTS_KEY = 'fleetCheckReports';
const USERS_KEY = 'fleetCheckUsers';
const CLOCK_STATE_KEY = 'fleetCheckClockState';
const CALENDAR_EVENTS_KEY = 'fleetCheckCalendarEvents';
const TIME_OFF_REQUESTS_KEY = 'fleetCheckTimeOffRequests';
const NOTIFICATIONS_KEY = 'fleetCheckNotifications';
const VIOLATIONS_KEY = 'fleetCheckViolations';


export const saveFleetAssets = (assets: FleetAsset[]): void => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(FLEET_ASSETS_KEY, JSON.stringify(assets));
    } catch (error) {
      console.error('Failed to save fleet assets:', error);
    }
  }
};

export const loadFleetAssets = (): FleetAsset[] => {
  if (typeof window !== 'undefined') {
    try {
      const data = localStorage.getItem(FLEET_ASSETS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to load fleet assets:', error);
      return [];
    }
  }
  return [];
};

export const saveInspectionReport = (report: InspectionReport): void => {
  if (typeof window !== 'undefined') {
    try {
      const reports = loadInspectionReports();
      const existingReportIndex = reports.findIndex(r => r.id === report.id);
      if (existingReportIndex > -1) {
        reports[existingReportIndex] = report;
      } else {
        reports.push(report);
      }
      localStorage.setItem(REPORTS_KEY, JSON.stringify(reports));
    } catch (error) {
      console.error('Failed to save inspection report:', error);
    }
  }
};

export const loadInspectionReports = (): InspectionReport[] => {
  if (typeof window !== 'undefined') {
    try {
      const data = localStorage.getItem(REPORTS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to load inspection reports:', error);
      return [];
    }
  }
  return [];
};

export const loadInspectionReportById = (id: string): InspectionReport | undefined => {
  if (typeof window !== 'undefined') {
    try {
      const reports = loadInspectionReports();
      return reports.find(report => report.id === id);
    } catch (error) {
      console.error('Failed to load inspection report by ID:', error);
      return undefined;
    }
  }
  return undefined;
};


// User Management
const defaultUsers: User[] = [
    { id: '1', name: 'John Doe', pin: '1234' },
    { id: '2', name: 'Jane Smith', pin: '4321' },
];

export const saveUsers = (users: User[]): void => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
    } catch (error) {
      console.error('Failed to save users:', error);
    }
  }
};

export const loadUsers = (): User[] => {
  if (typeof window !== 'undefined') {
    try {
      const data = localStorage.getItem(USERS_KEY);
      if (data) {
          return JSON.parse(data);
      } else {
          // On first load, seed with default users
          saveUsers(defaultUsers);
          return defaultUsers;
      }
    } catch (error) {
      console.error('Failed to load users:', error);
      return defaultUsers; // return defaults on error
    }
  }
  return [];
};

export const saveClockState = (state: ClockState): void => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(CLOCK_STATE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save clock state:', error);
    }
  }
};

export const loadClockState = (): ClockState => {
  if (typeof window !== 'undefined') {
    try {
      const data = localStorage.getItem(CLOCK_STATE_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Failed to load clock state:', error);
    }
  }
  // Default state if nothing is stored or on error
  return { status: 'clockedOut', timestamp: null };
};

// Calendar Events
const defaultEvents: CalendarEvent[] = [
    {
        id: '1',
        date: new Date().toISOString().split('T')[0],
        title: 'Team Meeting',
        type: 'company-event',
        description: 'All-hands meeting in the main conference room.'
    }
];

export const saveCalendarEvents = (events: CalendarEvent[]): void => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(CALENDAR_EVENTS_KEY, JSON.stringify(events));
    } catch (error) {
      console.error('Failed to save calendar events:', error);
    }
  }
};

export const loadCalendarEvents = (): CalendarEvent[] => {
  if (typeof window !== 'undefined') {
    try {
      const data = localStorage.getItem(CALENDAR_EVENTS_KEY);
      if(data) {
          return JSON.parse(data);
      } else {
          saveCalendarEvents(defaultEvents);
          return defaultEvents;
      }
    } catch (error) {
      console.error('Failed to load calendar events:', error);
      return defaultEvents;
    }
  }
  return [];
};

// Time Off Requests
export const saveTimeOffRequests = (requests: TimeOffRequest[]): void => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(TIME_OFF_REQUESTS_KEY, JSON.stringify(requests));
    } catch (error) {
      console.error('Failed to save time off requests:', error);
    }
  }
};

export const loadTimeOffRequests = (): TimeOffRequest[] => {
  if (typeof window !== 'undefined') {
    try {
      const data = localStorage.getItem(TIME_OFF_REQUESTS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to load time off requests:', error);
      return [];
    }
  }
  return [];
};

// Notifications
export const saveNotifications = (notifications: NotificationMessage[]): void => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
    } catch (error) {
      console.error('Failed to save notifications:', error);
    }
  }
};

export const loadNotifications = (): NotificationMessage[] => {
  if (typeof window !== 'undefined') {
    try {
      const data = localStorage.getItem(NOTIFICATIONS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to load notifications:', error);
      return [];
    }
  }
  return [];
};

// Violations
export const saveViolations = (violations: Violation[]): void => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(VIOLATIONS_KEY, JSON.stringify(violations));
    } catch (error) {
      console.error('Failed to save violations:', error);
    }
  }
};

export const loadViolations = (): Violation[] => {
  if (typeof window !== 'undefined') {
    try {
      const data = localStorage.getItem(VIOLATIONS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to load violations:', error);
      return [];
    }
  }
  return [];
};
