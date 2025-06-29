
import type { User, NotificationMessage } from './types';
import { SystemSettings, saveSystemSettings, defaultSettings } from './settingsService';

const USERS_KEY = 'fleetCheckUsers';
const NOTIFICATIONS_KEY = 'fleetCheckNotifications';

// NOTE: This service is now primarily for client-side state like notifications,
// or for seeding initial data for developers. Core application data is managed in firestoreService.ts.

const defaultUsers: User[] = [
    { uid: 'tallenholm-owner-uid', name: 'Tallen Holmgren', email: 'tallenholm@gmail.com', role: 'owner' },
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
      if (data) {
        return JSON.parse(data);
      }
      
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
