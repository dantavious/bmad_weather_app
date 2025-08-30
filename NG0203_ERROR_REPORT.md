# NG0203 Error Report - Angular CDK Drag-Drop Integration Issue

## Problem Summary
After implementing Story 2.4 (Location Management and Reordering) which adds drag-and-drop functionality using Angular CDK, the application throws NG0203 injection context errors at runtime.

## Current Errors

### Primary Error 1: NG0203 Injection Context Error
```
global-error-handler-simple.ts:21 [Error Handler] NG0203: The `_Platform` token injection failed. 
`inject()` function must be called from an injection context such as a constructor, 
a factory function, a field initializer, or a function used with `runInInjectionContext`. 
Find more at https://angular.dev/errors/NG0203
```

### Primary Error 2: Method Not Found
```
global-error-handler-simple.ts:21 [Error Handler] inject(...)._applyBodyHighContrastModeCssClasses is not a function
TypeError: inject(...)._applyBodyHighContrastModeCssClasses is not a function
    at new _MatCommonModule (common-module.mjs:27:38)
```

### Secondary Error (Likely unrelated - browser extension)
```
webcomponents-ce.js:33 Uncaught Error: A custom element with name 'mce-autosize-textarea' has already been defined.
```

## Stack Trace Analysis
The error originates from:
1. Angular CDK's `HighContrastModeDetector` service in `@angular/cdk/a11y`
2. Which is injected by `_MatCommonModule` from Angular Material
3. The injection happens during module initialization (outside proper injection context)

## Environment Details
- **Angular Version:** 20.2.0
- **Angular CDK Version:** 20.2.1
- **Angular Material Version:** 20.2.1
- **TypeScript Version:** 5.6+
- **Node Version:** Check with `node -v`
- **Project Type:** Standalone Angular application (no NgModules)

## What Was Implemented
Added drag-and-drop functionality to the dashboard component for reordering weather location cards:

### Files Modified:
1. **frontend/src/app/features/dashboard/dashboard.component.ts**
   - Added imports for CDK drag-drop
   - Implemented drop handler for reordering
   - Added location management controls (edit, delete, set primary)

2. **frontend/src/app/core/services/location.service.ts**
   - Added `reorderLocations()` method
   - Added `setPrimaryLocation()` method
   - Added `updateLocationName()` method
   - Implemented auto-save with signal effects

3. **frontend/src/app/shared/components/confirm-dialog/confirm-dialog.component.ts**
   - Created confirmation dialog for delete operations
   - Uses modern `inject()` pattern

## Attempted Solutions

### Attempt 1: Update Injection Pattern in ConfirmDialog
**File:** `confirm-dialog.component.ts`
**Change:** Converted from constructor injection to field injection
```typescript
// Before
constructor(
  public dialogRef: MatDialogRef<ConfirmDialogComponent>,
  @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData
) {}

// After
readonly dialogRef = inject(MatDialogRef<ConfirmDialogComponent>);
readonly data = inject<ConfirmDialogData>(MAT_DIALOG_DATA);
```
**Result:** Did not resolve the main error

### Attempt 2: Fix WeatherCard Effect
**File:** `weather-card.component.ts`
**Change:** Added null check in effect to prevent accessing undefined input
```typescript
private alertWatcher = effect(() => {
  if (this.location) { // Added check
    const alert = this.alertService.getAlertForLocation(this.location.id);
    this.hasAlert.set(!!alert);
    this.alertInfo.set(alert);
  }
});
```
**Result:** Did not resolve the main error

### Attempt 3: Switch CDK Import Method
**File:** `dashboard.component.ts`
**Change:** Changed from individual directive imports to module import
```typescript
// Before
import { CdkDropList, CdkDrag } from '@angular/cdk/drag-drop';
// ...
imports: [CdkDropList, CdkDrag, ...]

// After
import { DragDropModule } from '@angular/cdk/drag-drop';
// ...
imports: [DragDropModule, ...]
```
**Result:** Did not resolve the error

### Attempt 4: Mock HighContrastModeDetector
**File:** `app.config.ts`
**Change:** Provided a mock implementation to bypass the injection issue
```typescript
@Injectable({ providedIn: 'root' })
class MockHighContrastModeDetector {
  getHighContrastMode() {
    return 0; // No high contrast
  }
  
  _applyBodyHighContrastModeCssClasses() {
    // No-op - prevent errors from Material trying to call this
  }
}

export const appConfig: ApplicationConfig = {
  providers: [
    // ... other providers
    { provide: HighContrastModeDetector, useClass: MockHighContrastModeDetector }
  ]
};
```
**Result:** Still getting the error - Material seems to be calling inject() directly, not using our provider

## Root Cause Analysis
The issue appears to be that:
1. Angular Material's `MatCommonModule` is directly calling `inject(HighContrastModeDetector)` in its constructor or field initializer
2. This happens during module initialization, possibly before our mock provider is registered
3. The CDK drag-drop module indirectly triggers Material module initialization
4. The injection happens in a static/module context rather than a component context

## Possible Solutions to Try

### Option 1: Lazy Load Drag-Drop
Instead of importing DragDropModule directly, lazy load it only when needed:
```typescript
// In component
async ngOnInit() {
  const { DragDropModule } = await import('@angular/cdk/drag-drop');
  // Dynamically add to imports
}
```

### Option 2: Downgrade CDK/Material Versions
The issue might be specific to version 20.2.x. Try:
```bash
npm install @angular/cdk@20.0.0 @angular/material@20.0.0
```

### Option 3: Create Custom Drag-Drop Without CDK
Implement a simple drag-drop solution using native HTML5 drag events:
```typescript
onDragStart(event: DragEvent, index: number) {
  event.dataTransfer?.setData('text/plain', index.toString());
}

onDrop(event: DragEvent, dropIndex: number) {
  const dragIndex = parseInt(event.dataTransfer?.getData('text/plain') || '0');
  // Reorder logic
}
```

### Option 4: Use Different Import Strategy
Try importing through a separate module that provides all CDK requirements:
```typescript
// Create cdk-imports.module.ts
import { NgModule } from '@angular/core';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { A11yModule } from '@angular/cdk/a11y';

@NgModule({
  imports: [DragDropModule, A11yModule],
  exports: [DragDropModule]
})
export class CdkImportsModule {}
```

### Option 5: Patch the Platform Provider
Try providing the Platform token that CDK is looking for:
```typescript
import { Platform } from '@angular/cdk/platform';

providers: [
  Platform,
  // ... other providers
]
```

## How to Test Solutions
1. Kill any running dev server: `npx kill-port 4200`
2. Clear Angular cache: `rm -rf .angular/`
3. Reinstall dependencies: `npm ci`
4. Start the dev server: `npm start`
5. Open browser console and check for errors

## Files to Review
- `/home/derrick/code/bmad/frontend/src/app/app.config.ts` - Application configuration
- `/home/derrick/code/bmad/frontend/src/app/features/dashboard/dashboard.component.ts` - Component using drag-drop
- `/home/derrick/code/bmad/frontend/src/app/shared/components/confirm-dialog/confirm-dialog.component.ts` - Dialog component
- `/home/derrick/code/bmad/frontend/package.json` - Dependencies and versions

## Related Documentation
- [Angular NG0203 Error](https://angular.dev/errors/NG0203)
- [Angular CDK Drag Drop](https://material.angular.io/cdk/drag-drop/overview)
- [Angular 20 inject() function](https://angular.dev/guide/dependency-injection#inject)
- [Angular Standalone Components](https://angular.dev/guide/standalone-components)

## Questions for Investigation
1. Is there a specific order in which providers need to be registered?
2. Is the issue related to using standalone components vs NgModules?
3. Could this be a bug in Angular CDK 20.2.x?
4. Is there a way to defer CDK initialization until after the app is bootstrapped?

## Workaround Currently in Place
None - the application fails to load properly with the errors.

## Impact
- Drag-and-drop functionality for location reordering is not working
- Application shows console errors that affect user experience
- Story 2.4 cannot be completed without resolving this issue

## Recommendation
Given the complexity of the issue and that it appears to be related to internal Angular CDK/Material initialization, consider:
1. Implementing a custom drag-drop solution without CDK
2. Waiting for a CDK patch/update
3. Using an alternative drag-drop library (e.g., Sortable.js)