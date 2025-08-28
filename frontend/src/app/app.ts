import { Component } from '@angular/core';
import { AppShellComponent } from './app-shell-simple.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [AppShellComponent],
  template: `<app-shell />`,
  styles: []
})
export class App {}