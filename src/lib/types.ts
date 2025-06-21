
import type { AnalyzeInspectionReportsOutput } from '@/ai/flows/analyze-inspection-reports';
import type { LucideIcon } from 'lucide-react';

export type VehicleType = 'truck' | 'trailer' | 'skidSteer';

export interface User {
  id: string;
  name: string;
  pin: string;
}

export interface FleetAsset {
  id: string;
  type: VehicleType;
  name: string;
  vin: string;
}

export interface InspectionItem {
  id: string;
  name: string;
  instructions: string;
  Icon: LucideIcon;
}

export interface ChecklistSectionData {
  id: VehicleType;
  name: string;
  Icon: LucideIcon;
  items: InspectionItem[];
}

export type InspectionStatus = 'pass' | 'fail' | 'pending';

export interface CompletedInspectionItem {
  itemId: string;
  name: string; // For easier display in reports
  status: InspectionStatus;
  notes?: string;
  photoDataUri?: string;
}

export interface InspectionReport {
  id: string;
  type: 'pre-trip' | 'post-trip';
  date: string; // ISO string
  employeeId?: string;
  employeeName?: string;
  truckVin?: string;
  trailerVin?: string;
  skidSteerVin?: string;
  sections: Array<{
    vehicleType: VehicleType;
    name: string; // e.g. "Truck", "Trailer"
    items: CompletedInspectionItem[];
  }>;
  anomalyReport?: AnalyzeInspectionReportsOutput;
  overallStatus?: 'pass' | 'fail'; // Calculated based on item statuses
}

export type ClockStatus = 'clockedIn' | 'clockedOut';

export interface ClockState {
  status: ClockStatus;
  timestamp: string | null; // ISO string
}

export interface CalendarEvent {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  type: 'time-off' | 'company-event' | 'maintenance';
  description: string;
}

export type RequestStatus = 'pending' | 'approved' | 'denied';

export interface TimeOffRequest {
    id: string;
    employeeId: string;
    employeeName: string;
    startDate: string; // YYYY-MM-DD
    endDate: string; // YYYY-MM-DD
    reason: string;
    status: RequestStatus;
}

export interface NotificationMessage {
  id: string;
  timestamp: string; // ISO string
  title: string;
  content: string;
  recipientId: 'all' | string; // 'all' for all employees, or a specific user ID
  senderName: string; // Admin's name
  readBy: string[]; // Array of user IDs who have read it
}
