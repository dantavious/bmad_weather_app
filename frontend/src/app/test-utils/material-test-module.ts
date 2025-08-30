import { Provider } from '@angular/core';
import { PLATFORM_ID } from '@angular/core';

// Mock providers for Angular Material CDK dependencies
export function provideMaterialTestingModule(): Provider[] {
  return [
    { provide: PLATFORM_ID, useValue: 'browser' },
    // Mock Platform service
    {
      provide: 'Platform',
      useValue: {
        isBrowser: true,
        ANDROID: false,
        IOS: false,
        FIREFOX: false,
        EDGE: false,
        SAFARI: false,
        TRIDENT: false,
        WEBKIT: false,
        BLINK: true,
      }
    },
    // Mock HighContrastModeDetector
    {
      provide: 'HighContrastModeDetector',
      useValue: {
        getHighContrastMode: () => 0
      }
    }
  ];
}