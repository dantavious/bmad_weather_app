import { Component, OnInit, OnDestroy, inject, signal, WritableSignal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
// Removed CDK drag-drop due to NG0203 injection errors in Angular 20
// Using native HTML5 drag-drop instead
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import { Subject, takeUntil } from 'rxjs';
import { LocationService } from '../../core/services/location.service';
import { WeatherCardComponent } from './components/weather-card/weather-card.component';
import { AlertPanelComponent } from './components/alert-panel/alert-panel.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { WeatherLocation } from '@shared/models/location.model';
import { WeatherAlert } from './components/alert-badge/alert-badge.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatSnackBarModule,
    MatDialogModule,
    MatInputModule,
    MatFormFieldModule,
    MatTooltipModule,
    FormsModule,
    WeatherCardComponent,
    AlertPanelComponent
  ],
  animations: [
    trigger('listAnimation', [
      transition('* <=> *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(-15px)' }),
          stagger('50ms', animate('300ms ease-out', 
            style({ opacity: 1, transform: 'translateY(0)' })))
        ], { optional: true }),
        query(':leave', 
          animate('200ms', style({ opacity: 0, transform: 'scale(0.8)' })),
          { optional: true }
        )
      ])
    ])
  ],
  template: `
    <div class="dashboard-container">
      <header class="dashboard-header">
        <h1>Weather Dashboard</h1>
        @if (loading()) {
          <mat-progress-bar mode="indeterminate"></mat-progress-bar>
        }
      </header>
      
      @if (error()) {
        <mat-card class="error-card">
          <mat-card-content>
            <mat-icon color="warn">error_outline</mat-icon>
            <p>{{ error() }}</p>
            <button mat-button color="primary" (click)="loadLocations()">
              <mat-icon>refresh</mat-icon>
              Retry
            </button>
          </mat-card-content>
        </mat-card>
      }
      
      @if (locations().length > 0) {
        <div class="locations-grid" 
             (dragover)="onDragOver($event)"
             (drop)="onDrop($event)"
             [@listAnimation]="locations().length">
          @for (location of locations(); track location.id; let i = $index) {
            <div draggable="true"
                 (dragstart)="onDragStart($event, i)"
                 (dragend)="onDragEnd($event)"
                 (dragenter)="onDragEnter($event, i)"
                 class="location-card-wrapper"
                 [class.editing]="isEditing(location.id)"
                 [class.dragging]="draggedIndex === i">
              <div class="drag-handle">
                <mat-icon>drag_indicator</mat-icon>
              </div>
              @if (isEditing(location.id)) {
                <div class="edit-card">
                  <mat-form-field appearance="outline" class="name-field">
                    <mat-label>Location Name</mat-label>
                    <input matInput 
                           [(ngModel)]="editingName"
                           (keyup.enter)="saveLocationName(location.id)"
                           (keyup.escape)="cancelEdit(location.id)">
                  </mat-form-field>
                </div>
              } @else {
                <app-weather-card 
                  [location]="location"
                  [isFlipped]="getFlipState(location.id)"
                  (flipped)="onCardFlipped(location.id, $event)"
                ></app-weather-card>
              }
              <div class="card-controls">
                <button mat-icon-button 
                        (click)="toggleEdit(location.id)"
                        [matTooltip]="isEditing(location.id) ? 'Save' : 'Edit'">
                  <mat-icon>{{ isEditing(location.id) ? 'save' : 'edit' }}</mat-icon>
                </button>
                <button mat-icon-button 
                        (click)="togglePrimary(location.id)"
                        [matTooltip]="location.isPrimary ? 'Remove as primary' : 'Set as primary'">
                  <mat-icon [color]="location.isPrimary ? 'accent' : ''">{{ location.isPrimary ? 'star' : 'star_border' }}</mat-icon>
                </button>
                <button mat-icon-button 
                        color="warn"
                        (click)="deleteLocation(location)"
                        matTooltip="Delete location">
                  <mat-icon>delete</mat-icon>
                </button>
              </div>
            </div>
          }
        </div>
      } @else if (!loading() && !error()) {
        <mat-card class="empty-state">
          <mat-card-content>
            <mat-icon>location_off</mat-icon>
            <h2>No Locations Added</h2>
            <p>Add your first location to start tracking weather</p>
            <button mat-raised-button color="primary">
              <mat-icon>add_location</mat-icon>
              Add Location
            </button>
          </mat-card-content>
        </mat-card>
      }
      
      @if (showAlertPanel()) {
        <div class="alert-panel-overlay" (click)="closeAlertPanel()">
          <div class="alert-panel-container" (click)="$event.stopPropagation()">
            <div class="alert-panel-header">
              <h2>Weather Alerts</h2>
              <button mat-icon-button (click)="closeAlertPanel()">
                <mat-icon>close</mat-icon>
              </button>
            </div>
            <app-alert-panel [alertList]="selectedLocationAlerts()"></app-alert-panel>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .dashboard-container {
      padding: 24px;
      max-width: 1400px;
      margin: 0 auto;
    }
    
    .dashboard-header {
      margin-bottom: 32px;
    }
    
    .dashboard-header h1 {
      font-size: 2.5rem;
      font-weight: 300;
      margin: 0 0 16px 0;
      color: var(--mdc-theme-on-surface);
    }
    
    mat-progress-bar {
      margin-top: 8px;
    }
    
    .locations-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 32px;
      row-gap: 32px;
      margin-bottom: 32px;
      align-items: start;
      grid-auto-rows: minmax(320px, auto);
      padding-bottom: 24px;
      container-type: inline-size;
    }
    
    .location-card-wrapper {
      position: relative;
      transition: transform 0.2s;
    }
    
    .location-card-wrapper:hover .drag-handle {
      opacity: 1;
    }
    
    .location-card-wrapper.editing {
      transform: scale(0.98);
      box-shadow: 0 0 0 2px var(--mdc-theme-primary);
      border-radius: 12px;
    }
    
    .drag-handle {
      position: absolute;
      top: 8px;
      left: 8px;
      z-index: 10;
      cursor: move;
      opacity: 0;
      transition: opacity 0.2s;
      background: rgba(0, 0, 0, 0.6);
      border-radius: 4px;
      padding: 4px;
    }
    
    .drag-handle mat-icon {
      color: white;
      font-size: 20px;
      width: 20px;
      height: 20px;
    }
    
    .card-controls {
      position: absolute;
      top: 8px;
      right: 8px;
      z-index: 10;
      display: flex;
      gap: 4px;
      background: rgba(0, 0, 0, 0.6);
      border-radius: 20px;
      padding: 4px;
      opacity: 0;
      transition: opacity 0.2s;
    }
    
    .location-card-wrapper:hover .card-controls {
      opacity: 1;
    }
    
    .card-controls button {
      width: 32px;
      height: 32px;
    }
    
    .card-controls mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: white;
    }
    
    .location-card-wrapper.dragging {
      opacity: 0.5;
      transform: scale(0.95);
      cursor: grabbing;
    }
    
    .location-card-wrapper.drag-over {
      transform: translateY(5px);
    }
    
    @media (prefers-reduced-motion: reduce) {
      .location-card-wrapper {
        transition: none !important;
      }
    }
    
    .edit-card {
      background: var(--mdc-theme-surface);
      border-radius: 12px;
      padding: 24px;
      min-height: 320px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    
    .name-field {
      width: 100%;
      max-width: 300px;
    }
    
    @media (max-width: 768px) {
      .locations-grid {
        grid-template-columns: 1fr;
      }
    }
    
    .error-card,
    .empty-state {
      max-width: 600px;
      margin: 48px auto;
      text-align: center;
    }
    
    .error-card mat-card-content,
    .empty-state mat-card-content {
      padding: 48px 24px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
    }
    
    .error-card mat-icon,
    .empty-state mat-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: var(--mdc-theme-on-surface);
      opacity: 0.7;
    }
    
    .error-card mat-icon {
      color: #ef5350;
      opacity: 1;
    }
    
    .empty-state h2 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 400;
      color: var(--mdc-theme-on-surface);
    }
    
    .empty-state p {
      margin: 0;
      color: var(--mdc-theme-on-surface);
      opacity: 0.7;
    }
    
    .alert-panel-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      animation: fadeIn 0.3s;
    }
    
    .alert-panel-container {
      background: var(--mat-card-background-color);
      border-radius: 8px;
      max-width: 600px;
      width: 90%;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      animation: slideUp 0.3s;
    }
    
    .alert-panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 24px;
      border-bottom: 1px solid var(--mat-divider-color);
    }
    
    .alert-panel-header h2 {
      margin: 0;
      font-size: 20px;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    @keyframes slideUp {
      from { transform: translateY(20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
  `]
})
export class DashboardComponent implements OnInit, OnDestroy {
  private locationService = inject(LocationService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private destroy$ = new Subject<void>();
  
  locations = signal<WeatherLocation[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  flipStatesMap = new Map<string, WritableSignal<boolean>>();
  editingStates = new Map<string, boolean>();
  deletedLocation: WeatherLocation | null = null;
  editingName: string = '';
  draggedIndex: number | null = null;
  dragOverIndex: number | null = null;
  
  // Alert panel state
  selectedLocationAlerts = signal<WeatherAlert[]>([]);
  showAlertPanel = signal(false);
  
  ngOnInit() {
    this.loadLocations();
    this.subscribeToLocationUpdates();
    this.listenForAlertClicks();
  }
  
  ngOnDestroy() {
    this.locationService.stopAllAlertMonitoring();
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  loadLocations() {
    this.loading.set(true);
    this.error.set(null);
    
    this.locationService.fetchLocations().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (locations) => {
        this.locations.set(locations.slice(0, 5));
        this.loading.set(false);
        // Start alert monitoring for all locations
        locations.forEach(location => {
          this.locationService.startAlertMonitoring(location);
        });
      },
      error: (err) => {
        console.error('Error loading locations:', err);
        this.error.set('Failed to load locations');
        this.loading.set(false);
      }
    });
  }
  
  private subscribeToLocationUpdates() {
    this.locationService.locations$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(locations => {
      this.locations.set(locations.slice(0, 5));
    });
    
    this.locationService.loading$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(loading => {
      this.loading.set(loading);
    });
    
    this.locationService.error$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(error => {
      this.error.set(error);
    });
  }
  
  getFlipState(locationId: string): WritableSignal<boolean> {
    if (!this.flipStatesMap.has(locationId)) {
      this.flipStatesMap.set(locationId, signal(false));
    }
    return this.flipStatesMap.get(locationId)!;
  }
  
  onCardFlipped(locationId: string, isFlipped: boolean) {
    const flipSignal = this.getFlipState(locationId);
    flipSignal.set(isFlipped);
  }
  
  // Native HTML5 drag-drop methods
  onDragStart(event: DragEvent, index: number) {
    this.draggedIndex = index;
    event.dataTransfer!.effectAllowed = 'move';
    event.dataTransfer!.setData('text/html', ''); // Required for Firefox
  }
  
  onDragEnd(event: DragEvent) {
    this.draggedIndex = null;
    this.dragOverIndex = null;
  }
  
  onDragOver(event: DragEvent) {
    event.preventDefault(); // Allow drop
    event.dataTransfer!.dropEffect = 'move';
  }
  
  onDragEnter(event: DragEvent, index: number) {
    this.dragOverIndex = index;
  }
  
  onDrop(event: DragEvent) {
    event.preventDefault();
    
    if (this.draggedIndex === null || this.dragOverIndex === null) return;
    if (this.draggedIndex === this.dragOverIndex) return;
    
    const locations = [...this.locations()];
    const [draggedItem] = locations.splice(this.draggedIndex, 1);
    locations.splice(this.dragOverIndex, 0, draggedItem);
    
    // Update order properties
    const updatedLocations = locations.map((loc, index) => ({
      ...loc,
      order: index
    }));
    
    this.locations.set(updatedLocations);
    this.locationService.reorderLocations(this.draggedIndex, this.dragOverIndex);
    
    this.draggedIndex = null;
    this.dragOverIndex = null;
  }
  
  isEditing(locationId: string): boolean {
    return this.editingStates.get(locationId) || false;
  }
  
  toggleEdit(locationId: string) {
    const currentState = this.isEditing(locationId);
    
    if (!currentState) {
      // Start editing
      const location = this.locations().find(l => l.id === locationId);
      if (location) {
        this.editingName = location.name;
        this.editingStates.set(locationId, true);
      }
    } else {
      // Save changes
      this.saveLocationName(locationId);
    }
  }
  
  saveLocationName(locationId: string) {
    const location = this.locations().find(l => l.id === locationId);
    if (location && this.editingName && this.editingName !== location.name) {
      this.locationService.updateLocationName(locationId, this.editingName);
      this.snackBar.open('Location name updated', 'Dismiss', {
        duration: 2000
      });
    }
    this.editingStates.set(locationId, false);
    this.editingName = '';
  }
  
  cancelEdit(locationId: string) {
    this.editingStates.set(locationId, false);
    this.editingName = '';
  }
  
  togglePrimary(locationId: string) {
    this.locationService.setPrimaryLocation(locationId);
  }
  
  deleteLocation(location: WeatherLocation) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Location',
        message: `Delete "${location.name}"?`,
        confirmText: 'Delete',
        cancelText: 'Cancel'
      }
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Store for undo
        this.deletedLocation = location;
        
        // Delete the location
        this.locationService.deleteLocation(location.id).subscribe({
          next: () => {
            this.showUndoSnackbar(location);
          },
          error: (error) => {
            console.error('Error deleting location:', error);
            this.snackBar.open('Failed to delete location', 'Dismiss', {
              duration: 3000
            });
          }
        });
      }
    });
  }
  
  private showUndoSnackbar(location: WeatherLocation) {
    const snackBarRef = this.snackBar.open(
      `Location "${location.name}" deleted`,
      'UNDO',
      { duration: 5000 }
    );
    
    snackBarRef.onAction().subscribe(() => {
      if (this.deletedLocation) {
        this.locationService.addLocation(this.deletedLocation).subscribe({
          next: () => {
            this.deletedLocation = null;
            this.snackBar.open('Location restored', 'Dismiss', {
              duration: 2000
            });
          },
          error: (error) => {
            console.error('Error restoring location:', error);
            this.snackBar.open('Failed to restore location', 'Dismiss', {
              duration: 3000
            });
          }
        });
      }
    });
    
    // Clear deleted location after timeout
    setTimeout(() => {
      this.deletedLocation = null;
    }, 5000);
  }
  
  private listenForAlertClicks() {
    document.addEventListener('alertClick', (event: any) => {
      if (event.detail && event.detail.alerts) {
        this.selectedLocationAlerts.set(event.detail.alerts);
        this.showAlertPanel.set(true);
      }
    });
  }
  
  getAlertsForLocation(locationId: string): WeatherAlert[] {
    const alertsSignal = this.locationService.getAlertsForLocation(locationId);
    return alertsSignal();
  }
  
  closeAlertPanel() {
    this.showAlertPanel.set(false);
    this.selectedLocationAlerts.set([]);
  }
}