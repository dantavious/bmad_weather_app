import { Injectable, signal, computed, effect } from '@angular/core';
import { fromEvent, merge, of } from 'rxjs';
import { map, startWith, debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class OfflineService {
  private onlineStatus = signal(navigator.onLine);
  private lastOnlineTime = signal<Date | null>(null);
  private lastOfflineTime = signal<Date | null>(null);

  readonly isOnline = computed(() => this.onlineStatus());
  readonly isOffline = computed(() => !this.onlineStatus());
  readonly connectionStatus = computed(() => 
    this.onlineStatus() ? 'online' : 'offline'
  );
  readonly offlineDuration = computed(() => {
    if (this.isOnline()) return null;
    const offlineTime = this.lastOfflineTime();
    if (!offlineTime) return null;
    return Date.now() - offlineTime.getTime();
  });

  constructor() {
    this.initializeConnectionMonitoring();
    
    effect(() => {
      const online = this.onlineStatus();
      if (online) {
        this.lastOnlineTime.set(new Date());
        console.log('Connection restored');
      } else {
        this.lastOfflineTime.set(new Date());
        console.warn('Connection lost');
      }
    });
  }

  private initializeConnectionMonitoring(): void {
    const online$ = fromEvent(window, 'online').pipe(map(() => true));
    const offline$ = fromEvent(window, 'offline').pipe(map(() => false));
    
    merge(online$, offline$)
      .pipe(
        startWith(navigator.onLine),
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(status => {
        this.onlineStatus.set(status);
      });

    setInterval(() => {
      const wasOnline = this.onlineStatus();
      const isOnline = navigator.onLine;
      
      if (wasOnline !== isOnline) {
        this.onlineStatus.set(isOnline);
      }
    }, 5000);
  }

  async checkConnectivity(): Promise<boolean> {
    try {
      const response = await fetch('/assets/icons/icon-72x72.svg', {
        method: 'HEAD',
        cache: 'no-cache'
      });
      const isOnline = response.ok;
      this.onlineStatus.set(isOnline);
      return isOnline;
    } catch {
      this.onlineStatus.set(false);
      return false;
    }
  }

  getOfflineMessage(): string {
    const duration = this.offlineDuration();
    if (!duration) return 'You are currently offline';
    
    const minutes = Math.floor(duration / 60000);
    if (minutes < 1) return 'You are currently offline';
    if (minutes === 1) return 'You have been offline for 1 minute';
    if (minutes < 60) return `You have been offline for ${minutes} minutes`;
    
    const hours = Math.floor(minutes / 60);
    if (hours === 1) return 'You have been offline for 1 hour';
    return `You have been offline for ${hours} hours`;
  }
}