import { Component, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
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

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    MatSidenavModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatListModule,
    MatProgressBarModule,
    MatSnackBarModule
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
          <a mat-list-item href="#" aria-label="Dashboard">
            <mat-icon matListItemIcon>dashboard</mat-icon>
            <span matListItemTitle>Dashboard</span>
          </a>
          <a mat-list-item href="#" aria-label="Weather">
            <mat-icon matListItemIcon>wb_sunny</mat-icon>
            <span matListItemTitle>Weather</span>
          </a>
          <a mat-list-item href="#" aria-label="Settings">
            <mat-icon matListItemIcon>settings</mat-icon>
            <span matListItemTitle>Settings</span>
          </a>
        </mat-nav-list>
      </mat-sidenav>
      
      <mat-sidenav-content>
        <mat-toolbar color="primary">
          <button
            type="button"
            mat-icon-button
            (click)="drawer.toggle()"
            *ngIf="isHandset()"
            aria-label="Toggle navigation menu">
            <mat-icon>menu</mat-icon>
          </button>
          <span>DatDude Weather</span>
          <span class="spacer"></span>
          <button 
            mat-icon-button 
            (click)="toggleTheme()"
            [attr.aria-label]="'Switch to ' + (isDarkMode() ? 'light' : 'dark') + ' theme'"
            data-testid="theme-toggle">
            <mat-icon>{{ isDarkMode() ? 'light_mode' : 'dark_mode' }}</mat-icon>
          </button>
        </mat-toolbar>
        
        <mat-progress-bar 
          *ngIf="isLoading()" 
          mode="indeterminate"
          color="accent">
        </mat-progress-bar>
        
        <main class="content">
          <router-outlet />
        </main>
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
  
  private themeService = inject(ThemeService);
  private loadingService = inject(LoadingService);
  private breakpointObserver = inject(BreakpointObserver);

  isDarkMode = this.themeService.isDarkMode;
  isLoading = this.loadingService.isLoading;
  
  isHandset = () => this.breakpointObserver.isMatched('(max-width: 768px)');
  
  toggleTheme() {
    this.themeService.toggleTheme();
  }
}