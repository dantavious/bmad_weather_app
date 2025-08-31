import { Injectable, signal, computed, effect, inject } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';

@Injectable({ providedIn: 'root' })
export class InstallPromptService {
  private swUpdate = inject(SwUpdate);
  private deferredPrompt = signal<any>(null);
  private visitCount = signal<number>(0);
  private dismissed = signal<boolean>(false);
  private installed = signal<boolean>(false);

  readonly canInstall = computed(() => 
    this.deferredPrompt() !== null && 
    this.visitCount() >= 2 &&
    !this.dismissed() &&
    !this.installed()
  );

  readonly isInstalled = computed(() => this.installed());
  readonly isServiceWorkerEnabled = this.swUpdate.isEnabled;

  constructor() {
    this.loadVisitCount();
    this.loadDismissedState();
    this.captureInstallPrompt();
    this.detectInstallState();
    
    if (this.swUpdate.isEnabled) {
      this.initializeUpdateChecks();
    }

    effect(() => {
      const count = this.visitCount();
      if (count > 0) {
        localStorage.setItem('bmad_visit_count', count.toString());
      }
    });

    effect(() => {
      const dismissed = this.dismissed();
      localStorage.setItem('bmad_install_dismissed', dismissed.toString());
    });
  }

  private loadVisitCount(): void {
    const stored = localStorage.getItem('bmad_visit_count');
    const count = stored ? parseInt(stored, 10) : 0;
    this.visitCount.set(count + 1);
  }

  private loadDismissedState(): void {
    const dismissed = localStorage.getItem('bmad_install_dismissed');
    this.dismissed.set(dismissed === 'true');
  }

  private captureInstallPrompt(): void {
    window.addEventListener('beforeinstallprompt', (e: any) => {
      e.preventDefault();
      this.deferredPrompt.set(e);
    });

    window.addEventListener('appinstalled', () => {
      this.installed.set(true);
      this.deferredPrompt.set(null);
    });
  }

  private detectInstallState(): void {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      this.installed.set(true);
    }

    if ((navigator as any).standalone) {
      this.installed.set(true);
    }
  }

  private initializeUpdateChecks(): void {
    this.swUpdate.versionUpdates.subscribe(event => {
      switch (event.type) {
        case 'VERSION_READY':
          this.promptForUpdate();
          break;
        case 'VERSION_INSTALLATION_FAILED':
          console.error('Failed to install app version:', event.error);
          break;
      }
    });

    if (this.swUpdate.isEnabled) {
      setInterval(() => {
        this.swUpdate.checkForUpdate();
      }, 60000);
    }
  }

  private promptForUpdate(): void {
    if (confirm('New version available. Reload to update?')) {
      window.location.reload();
    }
  }

  async showInstallPrompt(): Promise<void> {
    const prompt = this.deferredPrompt();
    if (!prompt) return;

    try {
      prompt.prompt();
      const { outcome } = await prompt.userChoice;
      
      if (outcome === 'accepted') {
        this.installed.set(true);
      } else {
        this.dismissed.set(true);
      }
      
      this.deferredPrompt.set(null);
    } catch (error) {
      console.error('Error showing install prompt:', error);
    }
  }

  dismissInstallPrompt(): void {
    this.dismissed.set(true);
    this.deferredPrompt.set(null);
  }

  resetDismissal(): void {
    this.dismissed.set(false);
    localStorage.removeItem('bmad_install_dismissed');
  }
}