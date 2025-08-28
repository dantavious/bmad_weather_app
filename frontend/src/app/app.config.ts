import { ApplicationConfig, ErrorHandler, provideZoneChangeDetection, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { MatSnackBarModule } from '@angular/material/snack-bar';

import { routes } from './app.routes';
import { loadingInterceptor } from './core/interceptors/loading.interceptor';
import { GlobalErrorHandlerSimple } from './core/services/global-error-handler-simple';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([loadingInterceptor])),
    provideAnimationsAsync(),
    importProvidersFrom(MatSnackBarModule),
    { provide: ErrorHandler, useClass: GlobalErrorHandlerSimple }
  ]
};
