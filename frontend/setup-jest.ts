import 'zone.js';
import 'zone.js/testing';
import { setupZoneTestEnv } from 'jest-preset-angular/setup-env/zone';
setupZoneTestEnv();

import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import 'fake-indexeddb/auto';

// Set up platform ID for testing
beforeEach(() => {
  TestBed.configureTestingModule({
    providers: [
      { provide: PLATFORM_ID, useValue: 'browser' }
    ]
  });
});

// Mock structuredClone
import { structuredClone } from 'node:worker_threads';
if (!global.structuredClone) {
  global.structuredClone = structuredClone;
}

// Mock localStorage
const mockLocalStorage = (() => {
  let store: { [key: string]: string } = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Mock Google Maps
const google = {
  maps: {
    LatLng: class {
      constructor(public lat: number, public lng: number) {}
      lat() { return this.lat; }
      lng() { return this.lng; }
    },
    Map: class {
      constructor(el: HTMLElement, options: any) {}
      addListener(event: string, callback: Function) {}
      getBounds() {
        return {
          getNorthEast: () => ({ lat: () => 41, lng: () => -73 }),
          getSouthWest: () => ({ lat: () => 40, lng: () => -75 }),
        };
      }
      getProjection() {
        return {
          fromLatLngToPoint: (latLng: any) => ({ x: 100, y: 100 }),
        };
      }
      setOptions(options: any) {}
    },
    MapTypeId: {
      ROADMAP: 'roadmap',
    },
    ControlPosition: {
      TOP_RIGHT: 0,
      RIGHT_CENTER: 1,
    },
    event: {
      trigger: () => {},
    },
    Size: class {
      constructor(public width: number, public height: number) {}
    },
    Marker: class {
        addListener(event: string, callback: Function) {}
        setMap(map: any) {}
    },
    Animation: {
        DROP: 0,
    },
    Point: class {
        constructor(public x: number, public y: number) {}
    }
  },
};

(window as any).google = google;

// Mock Touch event
class Touch {
    identifier: number;
    target: EventTarget;
    clientX: number;
    clientY: number;
    screenX: number;
    screenY: number;
    pageX: number;
    pageY: number;

    constructor(init: Partial<Touch>) {
        this.identifier = init.identifier ?? 0;
        this.target = init.target!;
        this.clientX = init.clientX ?? 0;
        this.clientY = init.clientY ?? 0;
        this.screenX = init.screenX ?? 0;
        this.screenY = init.screenY ?? 0;
        this.pageX = init.pageX ?? 0;
        this.pageY = init.pageY ?? 0;
    }
}

(global as any).Touch = Touch;

// Mock ResizeObserver
class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

(window as any).ResizeObserver = ResizeObserver;

// Mock Clipboard API
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: jest.fn().mockResolvedValue(undefined),
  },
  configurable: true,
});

afterEach(() => {
  TestBed.resetTestingModule();
});

