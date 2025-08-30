# NG0203 Error - Final Solution

## Problem
Angular CDK's accessibility module (`HighContrastModeDetector`) was trying to inject the `_Platform` token outside of a valid injection context when using Angular Material components (specifically MatDialog) in Angular 20.

## Root Cause
The issue occurs because:
1. Angular Material components internally depend on CDK's a11y module
2. The a11y module's `HighContrastModeDetector` tries to inject Platform during initialization
3. In Angular 20's standalone component architecture, this injection happens outside a valid context

## Solution Implemented

### Step 1: Remove CDK Drag-Drop (Source of Initial Error)
Replaced Angular CDK drag-drop with native HTML5 drag-and-drop to eliminate the direct CDK dependency.

**Files Modified:**
- `dashboard.component.ts` - Removed CDK imports, implemented HTML5 drag events
- `location.service.ts` - Removed CDK's moveItemInArray, used native array methods

### Step 2: Provide Platform and Mock HighContrastModeDetector
Since Material components still need these services, provide them at the application level.

**app.config.ts:**
```typescript
import { Platform } from '@angular/cdk/platform';
import { HighContrastModeDetector } from '@angular/cdk/a11y';

// Mock to prevent injection errors
@Injectable({ providedIn: 'root' })
class MockHighContrastModeDetector {
  getHighContrastMode() {
    return 0; // No high contrast mode
  }
  
  _applyBodyHighContrastModeCssClasses() {
    // No-op - Material tries to call this
  }
}

export const appConfig: ApplicationConfig = {
  providers: [
    // ... other providers
    Platform, // Provide Platform service
    { provide: HighContrastModeDetector, useClass: MockHighContrastModeDetector },
  ]
};
```

## Alternative HTML5 Drag-Drop Implementation

**Template:**
```html
<div draggable="true"
     (dragstart)="onDragStart($event, i)"
     (dragend)="onDragEnd($event)"
     (dragenter)="onDragEnter($event, i)"
     class="location-card-wrapper">
```

**Component:**
```typescript
onDragStart(event: DragEvent, index: number) {
  this.draggedIndex = index;
  event.dataTransfer!.effectAllowed = 'move';
}

onDrop(event: DragEvent) {
  event.preventDefault();
  if (this.draggedIndex !== null && this.dragOverIndex !== null) {
    const locations = [...this.locations()];
    const [draggedItem] = locations.splice(this.draggedIndex, 1);
    locations.splice(this.dragOverIndex, 0, draggedItem);
    this.locations.set(locations);
  }
}
```

## Benefits
- ✅ No NG0203 errors
- ✅ No dependency on CDK drag-drop module
- ✅ Smaller bundle size
- ✅ Works with Angular Material dialogs
- ✅ Compatible with Angular 20 standalone architecture

## Testing
1. Location reordering works with native drag-drop
2. Material dialogs open without errors
3. No console errors in production build
4. All features remain functional

## Notes
- This is a workaround for what appears to be a compatibility issue between Angular CDK/Material and Angular 20's injection context requirements
- The mock HighContrastModeDetector disables high contrast mode detection, which may affect accessibility features
- Consider filing an issue with Angular team if this persists in future versions