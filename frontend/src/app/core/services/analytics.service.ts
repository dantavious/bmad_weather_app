import { Injectable, inject } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DestroyRef } from '@angular/core';

export interface AnalyticsEvent {
  category: 'navigation' | 'interaction' | 'performance' | 'error' | 'conversion';
  action: string;
  label?: string;
  value?: number;
  metadata?: Record<string, any>;
  timestamp: Date;
}

export interface PerformanceMetrics {
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  fcp?: number; // First Contentful Paint
  ttfb?: number; // Time to First Byte
}

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private eventQueue: AnalyticsEvent[] = [];
  private maxQueueSize = 100;
  private sessionStartTime = Date.now();
  private pageViewCount = 0;
  
  constructor() {
    this.initializePageTracking();
    this.initializePerformanceTracking();
  }
  
  private initializePageTracking(): void {
    // Track initial page view
    this.trackPageView(window.location.pathname);
    
    // Track navigation events
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((event: NavigationEnd) => {
        this.trackPageView(event.urlAfterRedirects);
      });
  }
  
  private initializePerformanceTracking(): void {
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      // Track Core Web Vitals
      this.trackWebVitals();
    }
  }
  
  trackPageView(path: string): void {
    this.pageViewCount++;
    const event: AnalyticsEvent = {
      category: 'navigation',
      action: 'page_view',
      label: path,
      value: this.pageViewCount,
      metadata: {
        referrer: document.referrer,
        sessionDuration: Date.now() - this.sessionStartTime
      },
      timestamp: new Date()
    };
    this.logEvent(event);
  }
  
  trackEvent(action: string, label?: string, value?: number, metadata?: Record<string, any>): void {
    const event: AnalyticsEvent = {
      category: 'interaction',
      action,
      label,
      value,
      metadata,
      timestamp: new Date()
    };
    this.logEvent(event);
  }
  
  trackConversion(action: string, value?: number, metadata?: Record<string, any>): void {
    const event: AnalyticsEvent = {
      category: 'conversion',
      action,
      value,
      metadata,
      timestamp: new Date()
    };
    this.logEvent(event);
  }
  
  trackError(error: string, fatal: boolean = false): void {
    const event: AnalyticsEvent = {
      category: 'error',
      action: fatal ? 'fatal_error' : 'error',
      label: error,
      metadata: {
        url: window.location.href,
        userAgent: navigator.userAgent
      },
      timestamp: new Date()
    };
    this.logEvent(event);
  }
  
  trackPerformance(metrics: PerformanceMetrics): void {
    const event: AnalyticsEvent = {
      category: 'performance',
      action: 'web_vitals',
      metadata: metrics,
      timestamp: new Date()
    };
    this.logEvent(event);
  }
  
  private trackWebVitals(): void {
    // Largest Contentful Paint (LCP)
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      const lcp = lastEntry.startTime;
      this.trackPerformance({ lcp });
    });
    
    try {
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
    } catch (e) {
      // Fallback for browsers that don't support this observer type
    }
    
    // First Input Delay (FID)
    const fidObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        if (entry.processingStart && entry.startTime) {
          const fid = entry.processingStart - entry.startTime;
          this.trackPerformance({ fid });
        }
      });
    });
    
    try {
      fidObserver.observe({ type: 'first-input', buffered: true });
    } catch (e) {
      // Fallback for browsers that don't support this observer type
    }
    
    // Cumulative Layout Shift (CLS)
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
        }
      }
      this.trackPerformance({ cls: clsValue });
    });
    
    try {
      clsObserver.observe({ type: 'layout-shift', buffered: true });
    } catch (e) {
      // Fallback for browsers that don't support this observer type
    }
    
    // First Contentful Paint (FCP) and Time to First Byte (TTFB)
    if (window.performance && window.performance.timing) {
      const timing = window.performance.timing;
      const navigationStart = timing.navigationStart;
      
      // TTFB
      if (timing.responseStart) {
        const ttfb = timing.responseStart - navigationStart;
        this.trackPerformance({ ttfb });
      }
      
      // FCP from paint timing API
      if ('PerformancePaintTiming' in window) {
        const paintEntries = performance.getEntriesByType('paint');
        const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint');
        if (fcpEntry) {
          this.trackPerformance({ fcp: fcpEntry.startTime });
        }
      }
    }
  }
  
  private logEvent(event: AnalyticsEvent): void {
    // Console logging for MVP
    this.logToConsole(event);
    
    // Queue event for future batch processing
    this.queueEvent(event);
    
    // Prepared for future Google Analytics 4 integration
    // if (typeof window !== 'undefined' && window.gtag) {
    //   this.sendToGA4(event);
    // }
  }
  
  private logToConsole(event: AnalyticsEvent): void {
    const logData = {
      timestamp: event.timestamp.toISOString(),
      category: event.category,
      action: event.action,
      ...(event.label && { label: event.label }),
      ...(event.value !== undefined && { value: event.value }),
      ...(event.metadata && { metadata: event.metadata })
    };
    
    console.info('[Analytics]', logData);
  }
  
  private queueEvent(event: AnalyticsEvent): void {
    this.eventQueue.push(event);
    
    // Keep queue size manageable
    if (this.eventQueue.length > this.maxQueueSize) {
      this.eventQueue.shift();
    }
  }
  
  // Future method for GA4 integration
  private sendToGA4(event: AnalyticsEvent): void {
    // Will be implemented when GA4 is added
    // window.gtag('event', event.action, {
    //   event_category: event.category,
    //   event_label: event.label,
    //   value: event.value,
    //   ...event.metadata
    // });
  }
  
  // Get analytics statistics
  getAnalyticsStats(): { 
    totalEvents: number; 
    byCategory: Record<string, number>;
    sessionDuration: number;
    pageViews: number;
  } {
    const stats = {
      totalEvents: this.eventQueue.length,
      byCategory: {} as Record<string, number>,
      sessionDuration: Date.now() - this.sessionStartTime,
      pageViews: this.pageViewCount
    };
    
    this.eventQueue.forEach(event => {
      stats.byCategory[event.category] = (stats.byCategory[event.category] || 0) + 1;
    });
    
    return stats;
  }
  
  // Helper methods for common tracking scenarios
  trackWeatherSearch(location: string): void {
    this.trackEvent('weather_search', location, undefined, {
      searchType: 'location',
      timestamp: new Date().toISOString()
    });
  }
  
  trackLocationAdded(location: string): void {
    this.trackConversion('location_added', 1, {
      location,
      timestamp: new Date().toISOString()
    });
  }
  
  trackFeatureUsed(feature: string): void {
    this.trackEvent('feature_used', feature);
  }
  
  trackAlertEnabled(alertType: string): void {
    this.trackConversion('alert_enabled', 1, {
      alertType,
      timestamp: new Date().toISOString()
    });
  }
}