
import type { InspectionReport, FleetAsset, User, UserRole, CalendarEvent, TimeOffRequest, NotificationMessage, Violation, ManagedDocument, MaintenanceLog, Task, ExpenseReport, Client, Job, WorkOrder } from './types';

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
const JOBS_KEY = 'fleetCheckJobs';
const WORK_ORDERS_KEY = 'fleetCheckWorkOrders';


const defaultFleetAssets: FleetAsset[] = [
    { id: 'truck-1', type: 'truck', name: 'Truck 01 (Dump Truck)', vin: '1GDTY7C1XMJ123456' },
    { id: 'truck-2', type: 'truck', name: 'Truck 02 (Dump Truck)', vin: '1GDTY7C1XMJ123457' },
    { id: 'trailer-1', type: 'trailer', name: 'Gooseneck Equipment Trailer', vin: '5TETL222XPA654321' },
    { id: 'heavyEquipment-1', type: 'heavyEquipment', name: 'CAT 259D3 Skid Steer', vin: 'CAT0259D3XYZ98765' },
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
      if (data) {
          return JSON.parse(data);
      } else {
          // On first load, seed with default assets
          saveFleetAssets(defaultFleetAssets);
          return defaultFleetAssets;
      }
    } catch (error) {
      console.error('Failed to load fleet assets:', error);
      return defaultFleetAssets; // return defaults on error
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
    { id: 'owner-1', name: 'Fleet Owner', pin: '5678', role: 'owner' },
    { id: 'manager-1', name: 'Operations Manager', pin: '8765', role: 'manager' },
    { id: '1', name: 'John Doe', pin: '1234', role: 'employee' },
    { id: '2', name: 'Jane Smith', pin: '4321', role: 'employee' },
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
      let users: User[] = data ? JSON.parse(data) : [];
      let needsSave = !data;

      // Ensure all default users exist and have the correct role and PIN.
      // This will overwrite any conflicting data from localStorage for default users.
      defaultUsers.forEach(defaultUser => {
        const existingUserIndex = users.findIndex(u => u.id === defaultUser.id);
        if (existingUserIndex > -1) {
          // User exists, let's check if the data is correct.
          const existingUser = users[existingUserIndex];
          if (existingUser.role !== defaultUser.role || existingUser.pin !== defaultUser.pin || existingUser.name !== defaultUser.name) {
            // Overwrite with default data if it's incorrect.
            users[existingUserIndex] = { ...existingUser, ...defaultUser };
            needsSave = true;
          }
        } else {
          // User doesn't exist, add the default user.
          users.push(defaultUser);
          needsSave = true;
        }
      });
      
      if (needsSave) {
        saveUsers(users);
      }

      return users;

    } catch (error) {
      console.error('Failed to load users:', error);
      // On any error, fall back to a clean default state.
      saveUsers(defaultUsers);
      return defaultUsers;
    }
  }
  return [];
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

// Documents
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
      employeeId: '1',
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
      employeeId: '1',
      employeeName: 'John Doe',
      documentDataUri: 'https://placehold.co/850x1100.png',
      dataAiHint: 'employment form',
    }
];

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
      if (data) {
          return JSON.parse(data);
      } else {
          saveDocuments(defaultDocuments);
          return defaultDocuments;
      }
    } catch (error) {
      console.error('Failed to load documents:', error);
      return defaultDocuments; // return defaults on error
    }
  }
  return [];
};


// Maintenance Logs
const defaultMaintenanceLogs: MaintenanceLog[] = [
    {
      id: 'log-1',
      assetId: 'truck-1',
      assetName: 'Truck 01 (Dump Truck)',
      date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 10 days ago
      serviceType: 'routine',
      description: 'Oil change and tire rotation.',
      cost: 150.75,
      mechanic: 'City Auto Repair'
    },
    {
      id: 'log-2',
      assetId: 'heavyEquipment-1',
      assetName: 'CAT 259D3 Skid Steer',
      date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
      serviceType: 'repair',
      description: 'Replaced worn hydraulic hose on lift arm.',
      cost: 325.50,
      mechanic: 'In-house'
    }
];

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
      if (data) {
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
      if (data) {
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

// Job Management
const defaultJobs: Job[] = [
    { 
      id: 'job-1', 
      name: 'Lot 5 Excavation', 
      clientId: 'client-1', 
      clientName: 'Main Street Properties', 
      address: '123 Main St, Anytown, USA', 
      jobValue: 50000, 
      startDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], 
      endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      assignedTruckIds: ['truck-1'],
      assignedHeavyEquipmentIds: ['heavyEquipment-1'],
      notes: [
        {
          timestamp: new Date().toISOString(),
          content: 'Initial site survey completed. Ready to break ground.',
          author: 'Operations Manager'
        }
      ]
    },
    { 
      id: 'job-2', 
      name: 'Downtown Plaza Snow Removal', 
      clientId: 'client-2', 
      clientName: 'City Development Group', 
      address: '456 Central Ave, Anytown, USA', 
      jobValue: 125000, 
      startDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], 
      endDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      assignedTruckIds: ['truck-1', 'truck-2'],
    },
    { 
      id: 'job-3', 
      name: 'Old Mill Foundation', 
      clientId: 'client-1', 
      clientName: 'Main Street Properties', 
      address: '789 River Rd, Anytown, USA', 
      jobValue: 78000, 
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], 
      endDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] 
    },
];

export const saveJobs = (jobs: Job[]): void => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(JOBS_KEY, JSON.stringify(jobs));
    } catch (error) {
      console.error('Failed to save jobs:', error);
    }
  }
};

export const loadJobs = (): Job[] => {
  if (typeof window !== 'undefined') {
    try {
      const data = localStorage.getItem(JOBS_KEY);
      if (data) {
          return JSON.parse(data);
      } else {
          saveJobs(defaultJobs);
          return defaultJobs;
      }
    } catch (error) {
      console.error('Failed to load jobs:', error);
      return defaultJobs;
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
