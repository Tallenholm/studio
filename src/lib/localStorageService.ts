
import type { InspectionReport, FleetAsset, User } from './types';

const FLEET_ASSETS_KEY = 'fleetCheckAssets';
const REPORTS_KEY = 'fleetCheckReports';
const USERS_KEY = 'fleetCheckUsers';


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
