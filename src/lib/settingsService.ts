
'use client';

export const themes = [
  { value: 'default', label: 'Default' },
  { value: 'theme-slate', label: 'Midnight Slate' },
  { value: 'theme-desert', label: 'Desert Mirage' },
  { value: 'theme-forest', label: 'Forest Canopy' },
];

export interface SystemSettings {
  theme: string;
  enableDarkMode: boolean;
  defaultFontSize: 'small' | 'medium' | 'large';
  enableEmailNotifications: boolean;
  notificationEmailAddress: string;
  locationLat: number;
  locationLon: number;
}

const SETTINGS_KEY = 'fleetCheckSystemSettings';

const defaultSettings: SystemSettings = {
  theme: 'default',
  enableDarkMode: true,
  defaultFontSize: 'medium',
  enableEmailNotifications: false,
  notificationEmailAddress: '',
  locationLat: 41.1200, // Kankakee, IL
  locationLon: -87.8612,
};

const applyTheme = (settings: SystemSettings) => {
  if (typeof document === 'undefined') return;

  document.documentElement.classList.forEach(c => {
    if (c.startsWith('theme-') || c === 'default') {
      document.documentElement.classList.remove(c);
    }
  });
  if (settings.theme !== 'default') {
    document.documentElement.classList.add(settings.theme);
  }

  if (settings.enableDarkMode) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
};

export const saveSystemSettings = (settings: SystemSettings): void => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      applyTheme(settings);
    } catch (error) {
      console.error('Failed to save system settings:', error);
    }
  }
};

export const loadSystemSettings = (): SystemSettings => {
  if (typeof window !== 'undefined') {
    try {
      const data = localStorage.getItem(SETTINGS_KEY);
      const settings = data ? { ...defaultSettings, ...JSON.parse(data) } : defaultSettings;
      applyTheme(settings);
      return settings;
    } catch (error) {
      console.error('Failed to load system settings:', error);
      applyTheme(defaultSettings);
      return defaultSettings;
    }
  }
  return defaultSettings;
};
