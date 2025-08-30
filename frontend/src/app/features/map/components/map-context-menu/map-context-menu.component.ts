import { Component, inject, signal, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';

export interface ContextMenuAction {
  icon: string;
  label: string;
  action: string;
  disabled?: boolean;
}

@Component({
  selector: 'app-map-context-menu',
  standalone: true,
  imports: [
    CommonModule,
    MatMenuModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule
  ],
  templateUrl: './map-context-menu.component.html',
  styleUrls: ['./map-context-menu.component.scss']
})
export class MapContextMenuComponent {
  @Input() latitude = 0;
  @Input() longitude = 0;
  @Input() canAddLocation = true;
  @Output() actionSelected = new EventEmitter<string>();
  
  menuActions = signal<ContextMenuAction[]>([
    {
      icon: 'wb_cloudy',
      label: 'View Weather',
      action: 'view-weather'
    },
    {
      icon: 'add_location',
      label: 'Add to Dashboard',
      action: 'add-location',
      disabled: false
    },
    {
      icon: 'share',
      label: 'Share Location',
      action: 'share'
    },
    {
      icon: 'directions',
      label: 'Get Directions',
      action: 'directions'
    }
  ]);
  
  ngOnChanges(): void {
    // Update the disabled state based on canAddLocation
    this.menuActions.update(actions => {
      return actions.map(action => {
        if (action.action === 'add-location') {
          return { ...action, disabled: !this.canAddLocation };
        }
        return action;
      });
    });
  }
  
  onActionClick(action: string): void {
    this.actionSelected.emit(action);
  }
}