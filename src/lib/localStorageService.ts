import type { InspectionReport, FleetAsset } from './types';

const FLEET_ASSETS_KEY = 'fleetCheckAssets';
const REPORTS_KEY = 'fleetCheckReports';

export const saveFleetAssets = (assets: FleetAsset[]): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(FLEET_ASSETS_KEY, JSON.stringify(assets));
  }
};

export const loadFleetAssets = (): FleetAsset[] => {
  if (typeof window !== 'undefined') {
    const data = localStorage.getItem(FLEET_ASSETS_KEY);
    return data ? JSON.parse(data) : [];
  }
  return [];
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
