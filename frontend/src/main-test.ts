import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideZoneChangeDetection } from '@angular/core';

@Component({
  selector: 'app-root',
  standalone: true,
  template: '<h1>Test App</h1>'
})
class TestApp {}

bootstrapApplication(TestApp, {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true })
  ]
}).catch(err => console.error('Bootstrap error:', err));