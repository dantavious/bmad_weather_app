import { ApplicationConfig, ErrorHandler, isDevMode, provideZoneChangeDetection, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideServiceWorker } from '@angular/service-worker';

import { routes } from './app.routes';
import { loadingInterceptor } from './core/interceptors/loading.interceptor';
import { GlobalErrorHandlerSimple } from './core/services/global-error-handler-simple';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes), // No preloading for optimal performance
    provideHttpClient(withInterceptors([loadingInterceptor])),
    provideAnimations(),
    { provide: PLATFORM_ID, useValue: 'browser' },
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000'
    }),
    { provide: ErrorHandler, useClass: GlobalErrorHandlerSimple }
  ]
};
