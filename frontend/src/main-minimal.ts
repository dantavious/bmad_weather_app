import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  selector: 'app-root',
  standalone: true,
  template: '<h1>Hello Angular</h1>'
})
class App {}

bootstrapApplication(App);