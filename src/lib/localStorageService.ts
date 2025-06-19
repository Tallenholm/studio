import type { InspectionReport, VehicleVins } from './types';

const VINS_KEY = 'fleetCheckVins';
const REPORTS_KEY = 'fleetCheckReports';

export const saveVins = (vins: VehicleVins): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(VINS_KEY, JSON.stringify(vins));
  }
};

export const loadVins = (): VehicleVins | null => {
  if (typeof window !== 'undefined') {
    const data = localStorage.getItem(VINS_KEY);
    return data ? JSON.parse(data) : null;
  }
  return null;
};

export const saveInspectionReport = (report: InspectionReport): void => {
  if (typeof window !== 'undefined') {
    const reports = loadInspectionReports();
    const existingReportIndex = reports.findIndex(r => r.id === report.id);
    if (existingReportIndex > -1) {
      reports[existingReportIndex] = report;
    } else {
      reports.push(report);
    }
    localStorage.setItem(REPORTS_KEY, JSON.stringify(reports));
  }
};

export const loadInspectionReports = (): InspectionReport[] => {
  if (typeof window !== 'undefined') {
    const data = localStorage.getItem(REPORTS_KEY);
    return data ? JSON.parse(data) : [];
  }
  return [];
};

export const loadInspectionReportById = (id: string): InspectionReport | undefined => {
  if (typeof window !== 'undefined') {
    const reports = loadInspectionReports();
    return reports.find(report => report.id === id);
  }
  return undefined;
};
