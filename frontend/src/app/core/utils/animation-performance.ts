import { Injectable, inject } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AnimationPerformanceService {
  private prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  isReducedMotionPreferred(): boolean {
    return this.prefersReducedMotion.matches;
  }

  getAnimationDuration(defaultDuration: number): number {
    return this.isReducedMotionPreferred() ? 0 : defaultDuration;
  }

  getAnimationConfig(duration: number = 300): string {
    if (this.isReducedMotionPreferred()) {
      return '0ms';
    }
    return `${duration}ms cubic-bezier(0.4, 0.0, 0.2, 1)`;
  }
}

export function applyWillChange(element: HTMLElement, property: string): void {
  element.style.willChange = property;
  
  setTimeout(() => {
    element.style.willChange = 'auto';
  }, 500);
}

export function requestAnimationFramePromise(): Promise<void> {
  return new Promise(resolve => {
    requestAnimationFrame(() => resolve());
  });
}

export function throttleAnimation(callback: () => void, delay: number = 16): () => void {
  let timeoutId: number | null = null;
  let lastExec = 0;

  return function throttled() {
    const elapsed = Date.now() - lastExec;

    if (elapsed > delay) {
      callback();
      lastExec = Date.now();
    } else {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = window.setTimeout(() => {
        callback();
        lastExec = Date.now();
      }, delay - elapsed);
    }
  };
}