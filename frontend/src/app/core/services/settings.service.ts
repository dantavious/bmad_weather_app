import { Injectable, signal, effect } from '@angular/core';
import { ActivitySettings, ActivityType } from '../../../../../shared/models/activity.model';

export interface UserSettings {
  units: 'imperial' | 'metric';
  theme: 'light' | 'dark' | 'auto';
  notifications: boolean;
  activitySettings?: ActivitySettings;
}

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly STORAGE_KEY = 'bmad_user_settings';
  
  private defaultSettings: UserSettings = {
    units: 'imperial',
    theme: 'auto',
    notifications: true,
    activitySettings: {
      showActivities: true,
      enabledActivities: Object.values(ActivityType),
      showBestHours: true
    }
  };
  
  settings = signal<UserSettings>(this.loadSettings());
  
  constructor() {
    effect(() => {
      this.saveSettings(this.settings());
    });
  }
  
  private loadSettings(): UserSettings {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        return { ...this.defaultSettings, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
    return this.defaultSettings;
  }
  
  private saveSettings(settings: UserSettings): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  }
  
  updateUnits(units: 'imperial' | 'metric'): void {
    this.settings.update(current => ({ ...current, units }));
  }
  
  updateTheme(theme: 'light' | 'dark' | 'auto'): void {
    this.settings.update(current => ({ ...current, theme }));
  }
  
  toggleNotifications(): void {
    this.settings.update(current => ({ 
      ...current, 
      notifications: !current.notifications 
    }));
  }
  
  getUnits(): 'imperial' | 'metric' {
    return this.settings().units;
  }
  
  getActivitySettings(): ActivitySettings | undefined {
    return this.settings().activitySettings;
  }
  
  updateActivitySettings(settings: ActivitySettings): void {
    this.settings.update(current => ({ 
      ...current, 
      activitySettings: settings 
    }));
  }
  
  toggleActivity(activityType: ActivityType): void {
    this.settings.update(current => {
      const currentSettings = current.activitySettings || {
        showActivities: true,
        enabledActivities: Object.values(ActivityType),
        showBestHours: true
      };
      
      const enabledActivities = currentSettings.enabledActivities.includes(activityType)
        ? currentSettings.enabledActivities.filter((a: ActivityType) => a !== activityType)
        : [...currentSettings.enabledActivities, activityType];
      
      return {
        ...current,
        activitySettings: {
          ...currentSettings,
          enabledActivities
        }
      };
    });
  }
}