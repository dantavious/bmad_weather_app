import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LoadingService {
  private readonly loadingCount = signal(0);
  readonly isLoading = signal(false);

  show() {
    this.loadingCount.update(count => count + 1);
    this.isLoading.set(true);
  }

  hide() {
    this.loadingCount.update(count => Math.max(0, count - 1));
    if (this.loadingCount() === 0) {
      this.isLoading.set(false);
    }
  }
}