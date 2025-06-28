
import type { DailyBriefingOutput, DailyBriefingInput } from '@/ai/flows/generate-daily-briefing';
import type { AnalyzeInspectionReportsOutput } from '@/ai/flows/analyze-inspection-reports';
import type { LucideIcon } from 'lucide-react';

export type { DailyBriefingOutput, DailyBriefingInput };

export type VehicleType = 'truck' | 'trailer' | 'heavyEquipment';
export type UserRole = 'owner' | 'manager' | 'employee' | 'guest';

export interface User {
  id: string;
  name: string;
  pin: string;
  role: UserRole;
}

export interface FleetAsset {
  id: string;
  type: VehicleType;
  name: string;
  vin: string;
  registrationDueDate?: string; // YYYY-MM-DD
  insuranceDueDate?: string; // YYYY-MM-DD
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
  heavyEquipmentVin?: string;
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
  category: string;
  documentType: 'general' | 'tax' | 'employment';
  documentDataUri: string;
  dataAiHint?: string;
  employeeId?: string;
  employeeName?: string;
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
  workOrderId?: string; // Link to the work order that generated this log
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

export type ExpenseCategory = 'fuel' | 'food' | 'lodging' | 'supplies' | 'other';

export interface ExpenseReport {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string; // YYYY-MM-DD
  amount: number;
  category: ExpenseCategory;
  description: string;
  receiptDataUri: string; // Required
  status: 'pending' | 'approved' | 'denied';
}

export interface Client {
  id: string;
  name: string;
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
}

export type JobStatus = 'upcoming' | 'active' | 'completed';

export interface Job {
  id:string;
  name: string;
  clientId: string;
  clientName: string;
  address: string;
  jobValue?: number;
  jobType: 'excavation' | 'snow_removal' | 'concrete' | 'misc';
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  assignedEmployeeIds?: string[];
  assignedTruckIds?: string[];
  assignedTrailerIds?: string[];
  assignedHeavyEquipmentIds?: string[];
  assignedSidewalkCrewIds?: string[]; // For snow removal sidewalk crews
  snowServices?: {
    plowing?: boolean;
    salting?: boolean;
    sidewalks?: boolean;
  };
  concreteYards?: number;
  notes?: {
    timestamp: string; // ISO string
    content: string;
    author: string;
  }[];
}

export type WorkOrderStatus = 'open' | 'in-progress' | 'completed' | 'on-hold';

export interface WorkOrder {
  id: string;
  reportId: string; // Link to the original inspection report
  assetId: string;
  assetName: string;
  dateCreated: string; // ISO string
  dateCompleted?: string | null; // ISO string
  reportedBy: string; // Employee name
  status: WorkOrderStatus;
  issueDescription: string;
  mechanicNotes?: string;
  mechanic?: string;
  cost?: number;
}

export type InventoryItemType = 'tool' | 'material' | 'consumable';
export type InventoryItemStatus = 'available' | 'in_use' | 'maintenance' | 'lost';
export type AssignmentType = 'employee' | 'job' | 'vehicle';

export interface InventoryItem {
  id: string;
  name: string;
  type: InventoryItemType;
  category?: string; // e.g., "Power Tools", "Hand Tools", "Fasteners"
  quantity: number;
  status: InventoryItemStatus;
  assignedToType?: AssignmentType;
  assignedToId?: string; // Corresponds to User, Job, or FleetAsset ID
  assignedToName?: string; // Denormalized for easy display
}
