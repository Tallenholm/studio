
import type { InspectionReport, FleetAsset, User, CalendarEvent, TimeOffRequest, NotificationMessage, Violation, ManagedDocument, MaintenanceLog, Task, ExpenseReport, Client, Job, WorkOrder, InventoryItem, SnowRoute, Rental } from './types';
import { addDays, subDays } from 'date-fns';

const FLEET_ASSETS_KEY = 'fleetCheckAssets';
const REPORTS_KEY = 'fleetCheckReports';
const USERS_KEY = 'fleetCheckUsers';
const CALENDAR_EVENTS_KEY = 'fleetCheckCalendarEvents';
const TIME_OFF_REQUESTS_KEY = 'fleetCheckTimeOffRequests';
const NOTIFICATIONS_KEY = 'fleetCheckNotifications';
const VIOLATIONS_KEY = 'fleetCheckViolations';
const DOCUMENTS_KEY = 'fleetCheckDocuments';
const MAINTENANCE_LOGS_KEY = 'fleetCheckMaintenanceLogs';
const TASKS_KEY = 'fleetCheckTasks';
const EXPENSE_REPORTS_KEY = 'fleetCheckExpenseReports';
const CLIENTS_KEY = 'fleetCheckClients';
const WORK_ORDERS_KEY = 'fleetCheckWorkOrders';
const INVENTORY_KEY = 'fleetCheckInventory';
const SNOW_ROUTES_KEY = 'fleetCheckSnowRoutes';
const RENTALS_KEY = 'fleetCheckRentals';
const SEED_DATA_VERSION_KEY = 'fleetCheckSeedDataVersion';
const CURRENT_SEED_VERSION = '1.3.1'; // Increment this to force a re-seed on next load


const defaultFleetAssets: FleetAsset[] = [
    { id: 'truck-1', type: 'truck', name: 'Truck 01 (Dump Truck)', vin: '1GDTY7C1XMJ123456', registrationDueDate: addDays(new Date(), 25).toISOString().split('T')[0], insuranceDueDate: addDays(new Date(), 90).toISOString().split('T')[0] },
    { id: 'truck-2', type: 'truck', name: 'Truck 02 (Plow Truck)', vin: '1GDTY7C1XMJ123457', registrationDueDate: subDays(new Date(), 10).toISOString().split('T')[0], insuranceDueDate: addDays(new Date(), 15).toISOString().split('T')[0] },
    { id: 'trailer-1', type: 'trailer', name: 'Gooseneck Equipment Trailer', vin: '5TETL222XPA654321', registrationDueDate: addDays(new Date(), 120).toISOString().split('T')[0] },
    { id: 'heavyEquipment-1', type: 'heavyEquipment', name: 'CAT 259D3 Skid Steer', vin: 'CAT0259D3XYZ98765', insuranceDueDate: addDays(new Date(), 300).toISOString().split('T')[0] },
];

const defaultEvents: CalendarEvent[] = [
    {
        id: '1',
        date: new Date().toISOString().split('T')[0],
        title: 'Team Meeting',
        type: 'company-event',
        description: 'All-hands meeting in the main conference room.'
    }
];

const defaultDocuments: ManagedDocument[] = [
    {
      id: 'doc-1',
      category: 'Truck 01 (Dump Truck)',
      title: 'Vehicle Registration - 2024',
      description: 'Official state vehicle registration document.',
      documentType: 'general',
      documentDataUri: 'https://placehold.co/850x1100.png',
      dataAiHint: 'official document',
    },
    {
      id: 'doc-2',
      category: 'Truck 01 (Dump Truck)',
      title: 'Insurance Card - 2024',
      description: 'Proof of liability insurance.',
      documentType: 'general',
      documentDataUri: 'https://placehold.co/850x1100.png',
      dataAiHint: 'insurance card',
    },
    {
      id: 'doc-4',
      category: 'Company Policies',
      title: 'Fleet Safety Manual',
      description: 'Company safety procedures and guidelines.',
      documentType: 'general',
      documentDataUri: 'https://placehold.co/850x1100.png',
      dataAiHint: 'manual safety',
    },
    {
      id: 'doc-5',
      category: 'John Doe',
      title: 'W-2 Form - 2023',
      description: 'Employee copy of W-2 tax form.',
      documentType: 'tax',
      employeeId: 'employee-1-uid',
      employeeName: 'John Doe',
      documentDataUri: 'https://placehold.co/850x1100.png',
      dataAiHint: 'tax form',
    },
    {
      id: 'doc-6',
      category: 'John Doe',
      title: 'I-9 Form',
      description: 'Employment Eligibility Verification form.',
      documentType: 'employment',
      employeeId: 'employee-1-uid',
      employeeName: 'John Doe',
      documentDataUri: 'https://placehold.co/850x1100.png',
      dataAiHint: 'employment form',
    }
];

const defaultMaintenanceLogs: MaintenanceLog[] = [
    {
      id: 'log-1',
      assetId: 'truck-1',
      assetName: 'Truck 01 (Dump Truck)',
      date: subDays(new Date(), 10).toISOString().split('T')[0],
      serviceType: 'routine',
      description: 'Oil change and tire rotation.',
      cost: 150.75,
      mechanic: 'City Auto Repair'
    },
    {
      id: 'log-2',
      assetId: 'heavyEquipment-1',
      assetName: 'CAT 259D3 Skid Steer',
      date: subDays(new Date(), 30).toISOString().split('T')[0],
      serviceType: 'repair',
      description: 'Replaced worn hydraulic hose on lift arm.',
      cost: 325.50,
      mechanic: 'In-house'
    }
];

const defaultInventory: InventoryItem[] = [
  { id: 'inv-1', name: 'DeWalt Circular Saw', type: 'tool', category: 'Power Tools', quantity: 2, status: 'available' },
  { id: 'inv-2', name: 'Shovel (Round Point)', type: 'tool', category: 'Hand Tools', quantity: 10, status: 'available' },
  { id: 'inv-3', name: 'Safety Cones (18")', type: 'material', category: 'Safety', quantity: 25, status: 'available' },
  { id: 'inv-4', name: '50lb Bag of Rock Salt', type: 'consumable', category: 'Winter Supplies', quantity: 100, status: 'available' },
  { id: 'inv-5', name: 'Hammer Drill', type: 'tool', category: 'Power Tools', quantity: 1, status: 'in_use', assignedToType: 'employee', assignedToId: 'employee-1-uid', assignedToName: 'John Doe' },
];

const defaultSnowRoutes: SnowRoute[] = [
    {
        id: 'route-plow-1',
        name: 'North Commercial Plow Route',
        type: 'plowing',
        assignedJobIds: ['job-2'],
        assignedVehicleIds: ['truck-2', 'heavyEquipment-1'],
        assignedEmployeeIds: ['employee-1-uid']
    },
    {
        id: 'route-sidewalk-1',
        name: 'Downtown Sidewalk Crew',
        type: 'sidewalks',
        assignedJobIds: ['job-2'],
        assignedVehicleIds: [],
        assignedEmployeeIds: ['employee-2-uid']
    }
];

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
      const version = localStorage.getItem(SEED_DATA_VERSION_KEY);
      if (data && version === CURRENT_SEED_VERSION) {
          return JSON.parse(data);
      } else {
          saveFleetAssets(defaultFleetAssets);
          return defaultFleetAssets;
      }
    } catch (error) {
      console.error('Failed to load fleet assets:', error);
      return defaultFleetAssets; 
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
// NOTE: This default user data is for local development and will be replaced by
// your Firebase Authentication and Firestore user data in production.
// The `uid` should match a user you create in Firebase Auth.
// You must also create a `users` collection in Firestore and add documents with
// these UIDs, including `name` and `role` fields.
const defaultUsers: User[] = [
    { uid: 'owner-uid', name: 'Fleet Owner', email: 'owner@company.com', role: 'owner' },
    { uid: 'manager-uid', name: 'Operations Manager', email: 'manager@company.com', role: 'manager' },
    { uid: 'employee-1-uid', name: 'John Doe', email: 'john.doe@company.com', role: 'employee' },
    { uid: 'employee-2-uid', name: 'Jane Smith', email: 'jane.smith@company.com', role: 'employee' },
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
      const version = localStorage.getItem(SEED_DATA_VERSION_KEY);

      if (data && version === CURRENT_SEED_VERSION) {
        return JSON.parse(data);
      }
      
      // If no data or version mismatch, seed default data
      saveUsers(defaultUsers);
      return defaultUsers;
    } catch (error) {
      console.error('Failed to load users:', error);
      saveUsers(defaultUsers);
      return defaultUsers;
    }
  }
  return [];
};

// Calendar Events
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
      const version = localStorage.getItem(SEED_DATA_VERSION_KEY);
      if(data && version === CURRENT_SEED_VERSION) {
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

// Documents
export const saveDocuments = (documents: ManagedDocument[]): void => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(DOCUMENTS_KEY, JSON.stringify(documents));
    } catch (error) {
      console.error('Failed to save documents:', error);
    }
  }
};

export const loadDocuments = (): ManagedDocument[] => {
  if (typeof window !== 'undefined') {
    try {
      const data = localStorage.getItem(DOCUMENTS_KEY);
      const version = localStorage.getItem(SEED_DATA_VERSION_KEY);
      if (data && version === CURRENT_SEED_VERSION) {
          return JSON.parse(data);
      } else {
          saveDocuments(defaultDocuments);
          return defaultDocuments;
      }
    } catch (error) {
      console.error('Failed to load documents:', error);
      return defaultDocuments; 
    }
  }
  return [];
};


// Maintenance Logs
export const saveMaintenanceLogs = (logs: MaintenanceLog[]): void => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(MAINTENANCE_LOGS_KEY, JSON.stringify(logs));
    } catch (error) {
      console.error('Failed to save maintenance logs:', error);
    }
  }
};

export const loadMaintenanceLogs = (): MaintenanceLog[] => {
  if (typeof window !== 'undefined') {
    try {
      const data = localStorage.getItem(MAINTENANCE_LOGS_KEY);
      const version = localStorage.getItem(SEED_DATA_VERSION_KEY);
      if (data && version === CURRENT_SEED_VERSION) {
          return JSON.parse(data);
      } else {
          saveMaintenanceLogs(defaultMaintenanceLogs);
          return defaultMaintenanceLogs;
      }
    } catch (error) {
      console.error('Failed to load maintenance logs:', error);
      return defaultMaintenanceLogs;
    }
  }
  return [];
};

// Task Management
export const saveTasks = (tasks: Task[]): void => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
    } catch (error) {
      console.error('Failed to save tasks:', error);
    }
  }
};

export const loadTasks = (): Task[] => {
  if (typeof window !== 'undefined') {
    try {
      const data = localStorage.getItem(TASKS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to load tasks:', error);
      return [];
    }
  }
  return [];
};

// Expense Reports
export const saveExpenseReports = (reports: ExpenseReport[]): void => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(EXPENSE_REPORTS_KEY, JSON.stringify(reports));
    } catch (error) {
      console.error('Failed to save expense reports:', error);
    }
  }
};

export const loadExpenseReports = (): ExpenseReport[] => {
  if (typeof window !== 'undefined') {
    try {
      const data = localStorage.getItem(EXPENSE_REPORTS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to load expense reports:', error);
      return [];
    }
  }
  return [];
};

// Client Management
const defaultClients: Client[] = [
    { id: 'client-1', name: 'Main Street Properties', contactPerson: 'Bob Vance', contactEmail: 'bob.vance@vancerefrigeration.com', contactPhone: '555-123-4567' },
    { id: 'client-2', name: 'City Development Group', contactPerson: 'Carol Smith', contactEmail: 'carol.s@cdg.com', contactPhone: '555-987-6543' },
    { id: 'client-3', name: 'Suburban Homes LLC', contactPerson: 'Don Patterson', contactEmail: 'don@suburban.com', contactPhone: '555-555-5555' },
];

export const saveClients = (clients: Client[]): void => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(CLIENTS_KEY, JSON.stringify(clients));
    } catch (error) {
      console.error('Failed to save clients:', error);
    }
  }
};

export const loadClients = (): Client[] => {
  if (typeof window !== 'undefined') {
    try {
      const data = localStorage.getItem(CLIENTS_KEY);
      const version = localStorage.getItem(SEED_DATA_VERSION_KEY);
      if (data && version === CURRENT_SEED_VERSION) {
          return JSON.parse(data);
      } else {
          saveClients(defaultClients);
          return defaultClients;
      }
    } catch (error) {
      console.error('Failed to load clients:', error);
      return defaultClients;
    }
  }
  return [];
};

// Work Order Management
export const saveWorkOrders = (workOrders: WorkOrder[]): void => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(WORK_ORDERS_KEY, JSON.stringify(workOrders));
    } catch (error) {
      console.error('Failed to save work orders:', error);
    }
  }
};

export const loadWorkOrders = (): WorkOrder[] => {
  if (typeof window !== 'undefined') {
    try {
      const data = localStorage.getItem(WORK_ORDERS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to load work orders:', error);
      return [];
    }
  }
  return [];
};


// Inventory Management
export const saveInventory = (inventory: InventoryItem[]): void => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(INVENTORY_KEY, JSON.stringify(inventory));
    } catch (error) {
      console.error('Failed to save inventory:', error);
    }
  }
};

export const loadInventory = (): InventoryItem[] => {
  if (typeof window !== 'undefined') {
    try {
      const data = localStorage.getItem(INVENTORY_KEY);
      const version = localStorage.getItem(SEED_DATA_VERSION_KEY);
      if (data && version === CURRENT_SEED_VERSION) {
        return JSON.parse(data);
      } else {
        saveInventory(defaultInventory);
        return defaultInventory;
      }
    } catch (error) {
      console.error('Failed to load inventory:', error);
      return defaultInventory;
    }
  }
  return [];
};

// Snow Route Management
export const saveSnowRoutes = (routes: SnowRoute[]): void => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(SNOW_ROUTES_KEY, JSON.stringify(routes));
      } catch (error) {
        console.error('Failed to save snow routes:', error);
      }
    }
};
  
export const loadSnowRoutes = (): SnowRoute[] => {
    if (typeof window !== 'undefined') {
      try {
        const data = localStorage.getItem(SNOW_ROUTES_KEY);
        const version = localStorage.getItem(SEED_DATA_VERSION_KEY);
        if (data && version === CURRENT_SEED_VERSION) {
          return JSON.parse(data);
        } else {
          saveSnowRoutes(defaultSnowRoutes);
          return defaultSnowRoutes;
        }
      } catch (error) {
        console.error('Failed to load snow routes:', error);
        return defaultSnowRoutes;
      }
    }
    return [];
};


// Rental Management
const getDynamicRentals = (): Rental[] => {
  const now = new Date();
  return [
    {
      id: 'rental-1',
      assetId: 'heavyEquipment-1',
      assetName: 'CAT 259D3 Skid Steer',
      renterName: 'Friendly Farms',
      contactInfo: '555-333-4444',
      startDate: subDays(now, 3).toISOString().split('T')[0],
      endDate: addDays(now, 4).toISOString().split('T')[0],
      rate: 350,
      rateType: 'daily',
      notes: 'Rented for post-storm cleanup.'
    },
    {
      id: 'rental-2',
      assetId: 'trailer-1',
      assetName: 'Gooseneck Equipment Trailer',
      renterName: 'Bob Vance',
      contactInfo: 'Vance Refrigeration',
      startDate: addDays(now, 10).toISOString().split('T')[0],
      endDate: addDays(now, 17).toISOString().split('T')[0],
      rate: 500,
      rateType: 'weekly',
      notes: 'Needs the trailer for moving equipment to a new site.'
    }
  ];
}


export const saveRentals = (rentals: Rental[]): void => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(RENTALS_KEY, JSON.stringify(rentals));
    } catch (error) {
      console.error('Failed to save rentals:', error);
    }
  }
};

export const loadRentals = (): Rental[] => {
  if (typeof window !== 'undefined') {
    try {
      const data = localStorage.getItem(RENTALS_KEY);
      const version = localStorage.getItem(SEED_DATA_VERSION_KEY);
      if (data && version === CURRENT_SEED_VERSION) {
        return JSON.parse(data);
      }
      
      const defaultRentals = getDynamicRentals();
      saveRentals(defaultRentals);
      return defaultRentals;

    } catch (error) {
      console.error('Failed to load rentals:', error);
      return getDynamicRentals();
    }
  }
  return [];
};

// Seed version check on initial load.
if (typeof window !== 'undefined') {
  const version = localStorage.getItem(SEED_DATA_VERSION_KEY);
  if (version !== CURRENT_SEED_VERSION) {
      localStorage.removeItem(FLEET_ASSETS_KEY);
      localStorage.removeItem(USERS_KEY);
      localStorage.removeItem(CALENDAR_EVENTS_KEY);
      localStorage.removeItem(DOCUMENTS_KEY);
      localStorage.removeItem(MAINTENANCE_LOGS_KEY);
      localStorage.removeItem(CLIENTS_KEY);
      localStorage.removeItem(INVENTORY_KEY);
      localStorage.removeItem(SNOW_ROUTES_KEY);
      localStorage.removeItem(RENTALS_KEY);
      // We don't clear reports, requests, notifications, violations, tasks, or work orders to preserve user-generated history.
      
      // Set the new version
      localStorage.setItem(SEED_DATA_VERSION_KEY, CURRENT_SEED_VERSION);
  }
}
