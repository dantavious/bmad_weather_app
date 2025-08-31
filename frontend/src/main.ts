import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppShellComponent } from './app/app-shell.component';

bootstrapApplication(AppShellComponent, appConfig)
  .then(() => {
    // Register service worker for push notifications
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      navigator.serviceWorker.register('/service-worker.js')
        .then(registration => {
          console.log('Service Worker registered with scope:', registration.scope);
        })
        .catch(error => {
          console.error('Service Worker registration failed:', error);
        });
    } else {
      console.log('Push notifications not supported in this browser');
    }
  })
  .catch((err) => console.error('Bootstrap error:', err));
