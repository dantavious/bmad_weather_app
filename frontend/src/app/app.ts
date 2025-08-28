import { Component } from '@angular/core';
import { AppShellComponent } from './app-shell.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [AppShellComponent],
  template: `<app-shell />`,
  styles: []
})
export class App {}