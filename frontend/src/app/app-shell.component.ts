import { Component, ViewChild, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatSidenavModule, MatSidenav } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { BreakpointObserver } from '@angular/cdk/layout';
import { ThemeService } from './core/services/theme.service';
import { LoadingService } from './core/services/loading.service';
import { AnalyticsService } from './core/services/analytics.service';
import { InstallBannerComponent } from './shared/components/install-banner/install-banner.component';
import { OfflineIndicatorComponent } from './shared/components/offline-indicator/offline-indicator.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatSidenavModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatListModule,
    MatProgressBarModule,
    MatSnackBarModule,
    InstallBannerComponent,
    OfflineIndicatorComponent
  ],
  template: `
    <mat-sidenav-container class="sidenav-container">
      <mat-sidenav 
        #drawer 
        class="sidenav" 
        [mode]="isHandset() ? 'over' : 'side'"
        [opened]="!isHandset()"
        [attr.role]="'navigation'"
        fixedInViewport="false">
        <mat-toolbar>Menu</mat-toolbar>
        <mat-nav-list>
          <a mat-list-item routerLink="/dashboard" routerLinkActive="active" aria-label="Dashboard">
            <mat-icon matListItemIcon>dashboard</mat-icon>
            <span matListItemTitle>Dashboard</span>
          </a>
          <a mat-list-item routerLink="/search" routerLinkActive="active" aria-label="Search">
            <mat-icon matListItemIcon>search</mat-icon>
            <span matListItemTitle>Add Location</span>
          </a>
          <a mat-list-item routerLink="/map" routerLinkActive="active" aria-label="Map">
            <mat-icon matListItemIcon>map</mat-icon>
            <span matListItemTitle>Weather Map</span>
          </a>
          <a mat-list-item routerLink="/settings/alerts" routerLinkActive="active" aria-label="Alert Settings">
            <mat-icon matListItemIcon>notifications</mat-icon>
            <span matListItemTitle>Alert Settings</span>
          </a>
          <a mat-list-item routerLink="/solar" routerLinkActive="active" aria-label="Solar Calculator">
            <mat-icon matListItemIcon>solar_power</mat-icon>
            <span matListItemTitle>Solar Calculator</span>
          </a>
          <a mat-list-item href="#" aria-label="Settings">
            <mat-icon matListItemIcon>settings</mat-icon>
            <span matListItemTitle>Settings</span>
          </a>
        </mat-nav-list>
      </mat-sidenav>
      
      <mat-sidenav-content>
        <mat-toolbar color="primary">
          @if (isHandset()) {
            <button
              type="button"
              mat-icon-button
              (click)="drawer.toggle()"
              aria-label="Toggle navigation menu">
              <mat-icon>menu</mat-icon>
            </button>
          }
          <span>BMad Weather Dashboard</span>
          <span class="spacer"></span>
          <button 
            mat-icon-button
            routerLink="/search"
            aria-label="Add new location">
            <mat-icon>add_location</mat-icon>
          </button>
          <button 
            mat-icon-button 
            (click)="toggleTheme()"
            [attr.aria-label]="'Switch to ' + (isDarkMode() ? 'light' : 'dark') + ' theme'"
            data-testid="theme-toggle">
            <mat-icon>{{ isDarkMode() ? 'light_mode' : 'dark_mode' }}</mat-icon>
          </button>
        </mat-toolbar>
        
        <app-offline-indicator />
        
        @if (isLoading()) {
          <mat-progress-bar 
            mode="indeterminate"
            color="accent">
          </mat-progress-bar>
        }
        
        <main class="content">
          <router-outlet />
        </main>
        <app-install-banner />
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [`
    .sidenav-container {
      height: 100%;
    }
    
    .sidenav {
      width: 250px;
      background-color: var(--mat-app-surface-container);
    }
    
    .sidenav .mat-toolbar {
      background: inherit;
    }
    
    .mat-toolbar.mat-primary {
      position: sticky;
      top: 0;
      z-index: 1;
    }
    
    .spacer {
      flex: 1 1 auto;
    }
    
    .content {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }
    
    mat-progress-bar {
      position: sticky;
      top: 64px;
      z-index: 1;
    }
    
    @media (max-width: 599px) {
      mat-progress-bar {
        top: 56px;
      }
    }
  `]
})
export class AppShellComponent {
  @ViewChild('drawer') drawer!: MatSidenav;
  
  private readonly themeService = inject(ThemeService);
  private readonly loadingService = inject(LoadingService);
  private readonly breakpointObserver = inject(BreakpointObserver);
  private readonly analyticsService = inject(AnalyticsService);

  isDarkMode = this.themeService.isDarkMode;
  isLoading = this.loadingService.isLoading;
  isHandset = signal(false);
  
  constructor() {
    // Initialize analytics service (it auto-tracks page views and performance)
    // The service is injected to ensure it's instantiated
    
    // Subscribe to breakpoint changes
    this.breakpointObserver.observe(['(max-width: 768px)']).subscribe(result => {
      this.isHandset.set(result.matches);
    });
  }
  
  toggleTheme() {
    this.themeService.toggleTheme();
    // Track theme toggle interaction
    this.analyticsService.trackEvent('theme_toggle', this.isDarkMode() ? 'dark' : 'light');
  }
}