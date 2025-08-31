import { Injectable, inject, signal } from '@angular/core';
import { StorageService } from './storage.service';

export interface NotificationPreferences {
  enabled: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string; // HH:MM format
  quietHoursEnd: string; // HH:MM format
  locationAlerts: Map<string, boolean>; // locationId -> enabled
}

export interface PrecipitationNotification {
  locationId: string;
  locationName: string;
  minutesToStart: number;
  precipitationType: string;
  intensity: string;
  estimatedDuration: number;
}

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private storageService = inject(StorageService);
  
  private readonly PREFS_KEY = 'notification-preferences';
  private readonly PERMISSION_KEY = 'notification-permission';
  
  notificationPermission = signal<NotificationPermission>('default');
  preferences = signal<NotificationPreferences>({
    enabled: false,
    quietHoursEnabled: false,
    quietHoursStart: '22:00',
    quietHoursEnd: '06:00',
    locationAlerts: new Map(),
  });

  constructor() {
    this.loadPreferences();
    this.checkPermission();
  }

  private async loadPreferences(): Promise<void> {
    const saved = await this.storageService.get<any>(this.PREFS_KEY);
    if (saved) {
      // Convert locationAlerts array back to Map
      const prefs: NotificationPreferences = {
        ...saved,
        locationAlerts: new Map(saved.locationAlerts || []),
      };
      this.preferences.set(prefs);
    }
  }

  private async savePreferences(): Promise<void> {
    const prefs = this.preferences();
    // Convert Map to array for storage
    const toSave = {
      ...prefs,
      locationAlerts: Array.from(prefs.locationAlerts.entries()),
    };
    await this.storageService.set(this.PREFS_KEY, toSave);
  }

  private checkPermission(): void {
    if ('Notification' in window) {
      this.notificationPermission.set(Notification.permission);
    }
  }

  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('Notifications not supported in this browser');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      this.notificationPermission.set(permission);
      return permission === 'granted';
    }

    return false;
  }

  async enableNotifications(): Promise<boolean> {
    const hasPermission = await this.requestPermission();
    if (hasPermission) {
      this.preferences.update((prefs) => ({
        ...prefs,
        enabled: true,
      }));
      await this.savePreferences();
      return true;
    }
    return false;
  }

  async disableNotifications(): Promise<void> {
    this.preferences.update((prefs) => ({
      ...prefs,
      enabled: false,
    }));
    await this.savePreferences();
  }

  async setLocationAlertEnabled(
    locationId: string,
    enabled: boolean,
  ): Promise<void> {
    this.preferences.update((prefs) => {
      const newAlerts = new Map(prefs.locationAlerts);
      newAlerts.set(locationId, enabled);
      return {
        ...prefs,
        locationAlerts: newAlerts,
      };
    });
    await this.savePreferences();
  }

  isLocationAlertEnabled(locationId: string): boolean {
    return this.preferences().locationAlerts.get(locationId) ?? true;
  }

  async setQuietHours(
    enabled: boolean,
    start?: string,
    end?: string,
  ): Promise<void> {
    this.preferences.update((prefs) => ({
      ...prefs,
      quietHoursEnabled: enabled,
      quietHoursStart: start || prefs.quietHoursStart,
      quietHoursEnd: end || prefs.quietHoursEnd,
    }));
    await this.savePreferences();
  }

  private isInQuietHours(): boolean {
    const prefs = this.preferences();
    if (!prefs.quietHoursEnabled) {
      return false;
    }

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const [startHour, startMin] = prefs.quietHoursStart.split(':').map(Number);
    const [endHour, endMin] = prefs.quietHoursEnd.split(':').map(Number);
    
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    if (startTime <= endTime) {
      // Quiet hours don't cross midnight
      return currentTime >= startTime && currentTime < endTime;
    } else {
      // Quiet hours cross midnight
      return currentTime >= startTime || currentTime < endTime;
    }
  }

  async showPrecipitationAlert(
    notification: PrecipitationNotification,
  ): Promise<void> {
    // Check if notifications are enabled
    if (!this.preferences().enabled) {
      console.log('Notifications disabled');
      return;
    }

    // Check if this location has alerts enabled
    if (!this.isLocationAlertEnabled(notification.locationId)) {
      console.log(`Alerts disabled for location ${notification.locationId}`);
      return;
    }

    // Check quiet hours
    if (this.isInQuietHours()) {
      console.log('In quiet hours, suppressing notification');
      return;
    }

    // Check browser support and permission
    if (!('Notification' in window)) {
      console.warn('Notifications not supported');
      return;
    }

    if (Notification.permission !== 'granted') {
      console.warn('Notification permission not granted');
      return;
    }

    // Create notification
    const title = `${notification.precipitationType} starting soon`;
    const body = `${notification.intensity} ${notification.precipitationType} expected in ${notification.minutesToStart} minutes at ${notification.locationName}. Duration: ~${notification.estimatedDuration} minutes.`;
    
    const notificationOptions: NotificationOptions = {
      body,
      icon: '/assets/icons/rain-icon.png',
      badge: '/assets/icons/badge.png',
      tag: `precip-${notification.locationId}`,
      requireInteraction: false,
      silent: false,
      data: {
        locationId: notification.locationId,
        type: 'precipitation',
      },
    };

    try {
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        // Use service worker to show notification
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification(title, notificationOptions);
      } else {
        // Fallback to direct notification
        new Notification(title, notificationOptions);
      }
    } catch (error) {
      console.error('Failed to show notification:', error);
    }
  }

  async testNotification(): Promise<void> {
    const test: PrecipitationNotification = {
      locationId: 'test',
      locationName: 'Test Location',
      minutesToStart: 10,
      precipitationType: 'Rain',
      intensity: 'Light',
      estimatedDuration: 30,
    };
    
    await this.showPrecipitationAlert(test);
  }

  getAlertSettings(): { enabled: boolean; quietHours: { enabled: boolean; start: string; end: string } } {
    const prefs = this.preferences();
    return {
      enabled: prefs.enabled,
      quietHours: {
        enabled: prefs.quietHoursEnabled,
        start: prefs.quietHoursStart,
        end: prefs.quietHoursEnd
      }
    };
  }

  async sendNotification(title: string, body: string, options?: NotificationOptions): Promise<void> {
    // Check if notifications are enabled
    if (!this.preferences().enabled) {
      console.log('Notifications disabled');
      return;
    }

    // Check quiet hours
    if (this.isInQuietHours()) {
      console.log('In quiet hours, suppressing notification');
      return;
    }

    // Check browser support and permission
    if (!('Notification' in window)) {
      console.warn('Notifications not supported');
      return;
    }

    if (Notification.permission !== 'granted') {
      console.warn('Notification permission not granted');
      return;
    }

    try {
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        // Use service worker to show notification
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification(title, options || {});
      } else {
        // Fallback to direct notification
        new Notification(title, options || { body });
      }
    } catch (error) {
      console.error('Failed to show notification:', error);
    }
  }
}