import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly isDarkMode = signal(true);

  constructor() {
    const saved = localStorage.getItem('theme');
    if (saved) {
      this.isDarkMode.set(saved === 'dark');
    }
    this.applyTheme();
  }

  toggleTheme() {
    this.isDarkMode.update(dark => !dark);
    this.applyTheme();
  }

  private applyTheme() {
    const theme = this.isDarkMode() ? 'dark-theme' : 'light-theme';
    document.body.className = theme;
    localStorage.setItem('theme', this.isDarkMode() ? 'dark' : 'light');
  }
}