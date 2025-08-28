# Angular Animations Guide

## Overview
This guide documents animation patterns and best practices for Angular 20 applications, with specific focus on complex animations like 3D flips that combine Angular animations with CSS transforms.

## Table of Contents
1. [Basic Setup](#basic-setup)
2. [3D Flip Animation Pattern](#3d-flip-animation-pattern)
3. [Common Pitfalls and Solutions](#common-pitfalls-and-solutions)
4. [Testing Animations](#testing-animations)
5. [Performance Considerations](#performance-considerations)

## Basic Setup

### Required Imports
```typescript
import { 
  trigger, 
  state, 
  style, 
  transition, 
  animate,
  keyframes,
  query,
  stagger 
} from '@angular/animations';
```

### Component Configuration
```typescript
@Component({
  selector: 'app-animated',
  standalone: true,
  animations: [
    // Animation triggers defined here
  ],
  template: `...`
})
```

## 3D Flip Animation Pattern

### Working Implementation Example
Located in: `frontend/src/app/features/dashboard/components/weather-card/weather-card.component.ts`

### Key Requirements for 3D Flip

#### 1. HTML Structure
```html
<div class="flip-container">           <!-- Perspective container -->
  <div class="flip-inner" [@flipState]="flipState">  <!-- Animated element -->
    <div class="flip-front">...</div>  <!-- Front face -->
    <div class="flip-back">...</div>   <!-- Back face -->
  </div>
</div>
```

#### 2. Angular Animation Definition
```typescript
animations: [
  trigger('flipState', [
    state('active', style({
      transform: 'rotateY(179deg)'  // Use 179deg to avoid flickering
    })),
    state('inactive', style({
      transform: 'rotateY(0)'
    })),
    transition('active => inactive', animate('600ms ease-out')),
    transition('inactive => active', animate('600ms ease-in'))
  ])
]
```

#### 3. Critical CSS Properties
```scss
.flip-container {
  perspective: 1000px;  // Creates 3D space depth
}

.flip-inner {
  transform-style: preserve-3d;  // Maintains 3D space for children
  position: relative;
  width: 100%;
  height: 100%;
}

.flip-front,
.flip-back {
  position: absolute;
  width: 100%;
  backface-visibility: hidden;     // Hide reverse side
  -webkit-backface-visibility: hidden;  // Safari support
}

.flip-back {
  transform: rotateY(180deg);  // Pre-rotate back face
}
```

#### 4. Component Logic
```typescript
export class FlipComponent {
  flipState: string = 'inactive';
  
  toggleFlip() {
    this.flipState = (this.flipState === 'inactive') ? 'active' : 'inactive';
  }
}
```

## Common Pitfalls and Solutions

### Problem 1: Both Sides Visible/Duplicated Content
**Cause**: Missing or incorrect `backface-visibility` property
**Solution**: 
```scss
.flip-front, .flip-back {
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}
```

### Problem 2: Animation Not Working with Material Components
**Cause**: Material components have their own structure that conflicts with transforms
**Solution**: Wrap Material components properly:
```html
<!-- WRONG: Applying transform to mat-card directly -->
<mat-card [@flipState]="state">...</mat-card>

<!-- CORRECT: Wrap mat-card in animation container -->
<div [@flipState]="state">
  <mat-card class="flip-front">...</mat-card>
  <mat-card class="flip-back">...</mat-card>
</div>
```

### Problem 3: Dynamic Height Issues with Absolute Positioning
**Cause**: Both faces positioned absolutely, container has no natural height
**Solution Options**:

1. **Fixed Height**: Set min-height on container
```scss
.flip-container { min-height: 280px; }
```

2. **Conditional Rendering**: Use @if to render only active face
```html
@if (!flipped) {
  <div class="front">...</div>
} @else {
  <div class="back">...</div>
}
```

3. **Dynamic Positioning**: Switch position based on state
```scss
.flip-container:not(.is-flipped) .back { display: none; }
.flip-container.is-flipped .front { display: none; }
.flip-container.is-flipped .back { position: relative; }
```

### Problem 4: Flickering at 180deg
**Cause**: Browser rounding issues at exactly 180 degrees
**Solution**: Use 179deg instead:
```typescript
state('active', style({ transform: 'rotateY(179deg)' }))
```

### Problem 5: Animation Not Smooth
**Cause**: Missing perspective or transform-style
**Solution**: Ensure parent has perspective and preserve-3d:
```scss
.parent { perspective: 1000px; }
.animated { transform-style: preserve-3d; }
```

## Other Animation Patterns

### Slide Transitions
```typescript
trigger('slideIn', [
  transition(':enter', [
    style({ transform: 'translateX(-100%)' }),
    animate('300ms ease-in', style({ transform: 'translateX(0%)' }))
  ]),
  transition(':leave', [
    animate('300ms ease-out', style({ transform: 'translateX(100%)' }))
  ])
])
```

### Fade In/Out
```typescript
trigger('fade', [
  state('in', style({ opacity: 1 })),
  state('out', style({ opacity: 0 })),
  transition('in <=> out', animate('200ms'))
])
```

### Stagger Animation for Lists
```typescript
trigger('listAnimation', [
  transition('* <=> *', [
    query(':enter', [
      style({ opacity: 0, transform: 'translateY(-15px)' }),
      stagger('50ms', animate('300ms ease-out', 
        style({ opacity: 1, transform: 'translateY(0)' })))
    ], { optional: true })
  ])
])
```

## Testing Animations

### Disable During Tests
```typescript
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

TestBed.configureTestingModule({
  imports: [NoopAnimationsModule, YourComponent]
});
```

### Test Animation States
```typescript
it('should toggle flip state', () => {
  component.flipState = 'inactive';
  component.toggleFlip();
  expect(component.flipState).toBe('active');
});
```

## Performance Considerations

### 1. Use transform and opacity Only
These properties are GPU-accelerated and don't trigger reflow:
- ✅ `transform`, `opacity`
- ❌ `width`, `height`, `top`, `left` (cause reflow)

### 2. Use will-change Sparingly
```scss
.will-animate {
  will-change: transform;  // Only when animation is imminent
}
```

### 3. Avoid Animating Many Elements
Use virtual scrolling or pagination for large lists

### 4. Use Angular's Animation Callbacks
```typescript
@Component({
  template: `
    <div [@slide]="state" 
         (@slide.start)="onAnimationStart($event)"
         (@slide.done)="onAnimationDone($event)">
    </div>
  `
})
```

## Best Practices

1. **Keep Animations Consistent**: Use similar timing across the app (300ms, 600ms)
2. **Respect prefers-reduced-motion**: Check user preferences
3. **Test on Mobile**: Ensure smooth performance on lower-powered devices
4. **Use Animation Variables**: Define reusable timing constants
5. **Document Complex Animations**: Add comments explaining the animation logic

## Resources

- [Angular Animations API](https://angular.dev/guide/animations)
- [Material Design Motion](https://material.io/design/motion)
- [Web Animations API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API)

## Implementation Checklist

When implementing a 3D flip animation:

- [ ] HTML has proper nested structure (container > inner > faces)
- [ ] Container has `perspective` property
- [ ] Inner element has `transform-style: preserve-3d`
- [ ] Both faces have `backface-visibility: hidden`
- [ ] Back face is pre-rotated 180deg
- [ ] Angular animation trigger is properly defined
- [ ] Component has state management for flip
- [ ] Animation is tested on mobile devices
- [ ] Fallback for reduced-motion preference (optional)