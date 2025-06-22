
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

export interface Violation {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string; // YYYY-MM-DD
  type: 'safety' | 'conduct' | 'performance' | 'other';
  description: string;
  actionTaken: string;
}

export interface ManagedDocument {
  id: string;
  title: string;
  description: string;
  category: string; // The group header, e.g., "Truck - 2021 Chevy 6500" or "Company Policies"
  documentDataUri: string; // Can be a placeholder URL or a real data URI
  dataAiHint?: string; // Optional hint for image generation
}

export interface MaintenanceLog {
  id: string;
  assetId: string; // From FleetAsset
  assetName: string;
  date: string; // YYYY-MM-DD
  serviceType: 'routine' | 'repair' | 'inspection' | 'other';
  description: string;
  cost?: number;
  mechanic?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assignedToEmployeeId: string;
  assignedToEmployeeName: string;
  createdByAdminName: string;
  dateAssigned: string; // ISO string
  dateCompleted: string | null; // ISO string
  status: 'pending' | 'completed';
  requiresPhoto: boolean;
  completionNotes?: string;
  completionPhotoUri?: string;
}
