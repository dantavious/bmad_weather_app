import { Injectable, signal, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private platformId = inject(PLATFORM_ID);
  readonly isDarkMode = signal(true);
  
  constructor() {
    // Only access browser APIs if we're in the browser
    if (isPlatformBrowser(this.platformId)) {
      const saved = localStorage.getItem('theme');
      if (saved) {
        this.isDarkMode.set(saved === 'dark');
      }
      this.applyTheme();
    }
  }

  toggleTheme() {
    this.isDarkMode.update(dark => !dark);
    this.applyTheme();
  }

  private applyTheme() {
    if (isPlatformBrowser(this.platformId)) {
      const theme = this.isDarkMode() ? 'dark-theme' : 'light-theme';
      document.body.className = theme;
      localStorage.setItem('theme', this.isDarkMode() ? 'dark' : 'light');
    }
  }
}