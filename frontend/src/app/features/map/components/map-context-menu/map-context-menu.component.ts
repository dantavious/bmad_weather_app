import { Component, inject, signal, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { trigger, transition, style, animate } from '@angular/animations';

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
    MatButtonModule,
    MatIconModule,
    MatDividerModule
  ],
  templateUrl: './map-context-menu.component.html',
  styleUrls: ['./map-context-menu.component.scss'],
  animations: [
    trigger('slideUp', [
      transition(':enter', [
        style({ transform: 'translateY(10px)', opacity: 0 }),
        animate('200ms ease-out', style({ transform: 'translateY(0)', opacity: 1 }))
      ])
    ])
  ]
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