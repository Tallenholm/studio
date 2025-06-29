
import type { NotificationMessage } from './types';
import { SystemSettings, saveSystemSettings, defaultSettings } from './settingsService';

const NOTIFICATIONS_KEY = 'fleetCheckNotifications';

// NOTE: This service is now only for client-side state like notifications.
// All core application data is managed in firestoreService.ts.

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
