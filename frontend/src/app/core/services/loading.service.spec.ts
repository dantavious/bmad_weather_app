import { TestBed } from '@angular/core/testing';
import { LoadingService } from './loading.service';
import { importProvidersFrom } from '@angular/core';
import { MatDialogModule } from '@angular/material/dialog';
import { A11yModule } from '@angular/cdk/a11y';
import { PlatformModule } from '@angular/cdk/platform';
import { LayoutModule } from '@angular/cdk/layout';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('LoadingService', () => {
  let service: LoadingService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [NoopAnimationsModule],
      providers: [
        importProvidersFrom(
          MatDialogModule,
          A11yModule,
          PlatformModule,
          LayoutModule
        ),
      ]
    });
    service = TestBed.inject(LoadingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initially not be loading', () => {
    expect(service.isLoading()).toBe(false);
  });

  it('should set loading to true when show is called', () => {
    service.show();
    expect(service.isLoading()).toBe(true);
  });

  it('should set loading to false when hide is called after show', () => {
    service.show();
    service.hide();
    expect(service.isLoading()).toBe(false);
  });

  it('should handle multiple show calls correctly', () => {
    service.show();
    service.show();
    service.show();
    expect(service.isLoading()).toBe(true);
    
    service.hide();
    expect(service.isLoading()).toBe(true);
    
    service.hide();
    expect(service.isLoading()).toBe(true);
    
    service.hide();
    expect(service.isLoading()).toBe(false);
  });

  it('should not go negative when hide is called more than show', () => {
    service.hide();
    service.hide();
    expect(service.isLoading()).toBe(false);
    
    service.show();
    expect(service.isLoading()).toBe(true);
    
    service.hide();
    expect(service.isLoading()).toBe(false);
  });
});
