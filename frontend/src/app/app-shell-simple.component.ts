import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ThemeService } from './core/services/theme.service';
import { LoadingService } from './core/services/loading.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    CommonModule, 
    RouterOutlet,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatSidenavModule,
    MatProgressBarModule
  ],
  template: `
    <mat-sidenav-container class="sidenav-container">
      <mat-sidenav-content>
        <mat-toolbar color="primary">
          <mat-icon>cloud</mat-icon>
          <span class="toolbar-title">DatDude Weather</span>
          <span class="spacer"></span>
          <button mat-icon-button (click)="toggleTheme()" [attr.aria-label]="'Switch to ' + (isDarkMode() ? 'light' : 'dark') + ' mode'">
            <mat-icon>{{ isDarkMode() ? 'light_mode' : 'dark_mode' }}</mat-icon>
          </button>
        </mat-toolbar>
        @if (isLoading()) {
          <mat-progress-bar mode="indeterminate" class="loading-bar"></mat-progress-bar>
        }
        <main class="app-content">
          <router-outlet />
        </main>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [`
    .sidenav-container {
      height: 100vh;
      display: flex;
      flex-direction: column;
    }
    
    mat-toolbar {
      position: sticky;
      top: 0;
      z-index: 1000;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .toolbar-title {
      margin-left: 16px;
      font-size: 20px;
      font-weight: 500;
    }
    
    .spacer {
      flex: 1 1 auto;
    }
    
    .loading-bar {
      position: sticky;
      top: 64px;
      z-index: 999;
    }
    
    .app-content {
      flex: 1;
      overflow-y: auto;
      background: var(--mdc-theme-background);
      color: var(--mdc-theme-on-surface);
    }
    
    mat-sidenav-content {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    
    @media (max-width: 599px) {
      mat-toolbar {
        height: 56px;
      }
      
      .loading-bar {
        top: 56px;
      }
    }
  `]
})
export class AppShellComponent {
  private themeService = inject(ThemeService);
  private loadingService = inject(LoadingService);
  
  isDarkMode = this.themeService.isDarkMode;
  isLoading = this.loadingService.isLoading;
  
  toggleTheme() {
    this.themeService.toggleTheme();
  }
}