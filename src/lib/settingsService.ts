
'use client';

export interface SystemSettings {
  enableDarkMode: boolean;
  defaultFontSize: 'small' | 'medium' | 'large';
  enableEmailNotifications: boolean;
  notificationEmailAddress: string;
  locationLat: number;
  locationLon: number;
}

const SETTINGS_KEY = 'fleetCheckSystemSettings';

const defaultSettings: SystemSettings = {
  enableDarkMode: true,
  defaultFontSize: 'medium',
  enableEmailNotifications: false,
  notificationEmailAddress: '',
  locationLat: 41.1200, // Kankakee, IL
  locationLon: -87.8612,
};

export const saveSystemSettings = (settings: SystemSettings): void => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save system settings:', error);
    }
  }
};

export const loadSystemSettings = (): SystemSettings => {
  if (typeof window !== 'undefined') {
    try {
      const data = localStorage.getItem(SETTINGS_KEY);
      if (data) {
        // Merge saved settings with defaults to handle new settings being added
        const saved = JSON.parse(data);
        return { ...defaultSettings, ...saved };
      } else {
        saveSystemSettings(defaultSettings);
        return defaultSettings;
      }
    } catch (error) {
      console.error('Failed to load system settings:', error);
      return defaultSettings;
    }
  }
  return defaultSettings;
};
