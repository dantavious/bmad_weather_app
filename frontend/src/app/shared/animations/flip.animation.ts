import {
  animate,
  state,
  style,
  transition,
  trigger,
  query,
  animateChild,
} from '@angular/animations';

const ANIMATION_DURATION = '300ms cubic-bezier(0.4, 0.0, 0.2, 1)';
const REDUCED_MOTION_DURATION = '0ms';

function getAnimationDuration(): string {
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return REDUCED_MOTION_DURATION;
  }
  return ANIMATION_DURATION;
}

export const flipAnimation = trigger('flip', [
  state(
    'front',
    style({
      transform: 'rotateY(0deg)',
      willChange: 'transform',
    }),
  ),
  state(
    'back',
    style({
      transform: 'rotateY(180deg)',
      willChange: 'transform',
    }),
  ),
  transition('front => back', [
    animate(
      getAnimationDuration(),
      style({
        transform: 'rotateY(180deg)',
      }),
    ),
  ]),
  transition('back => front', [
    animate(
      getAnimationDuration(),
      style({
        transform: 'rotateY(0deg)',
      }),
    ),
  ]),
]);

export const cardFlipAnimation = trigger('cardFlip', [
  state(
    'default',
    style({
      transform: 'rotateY(0)',
      willChange: 'transform',
    }),
  ),
  state(
    'flipped',
    style({
      transform: 'rotateY(180deg)',
      willChange: 'transform',
    }),
  ),
  transition('default => flipped', [
    animate(getAnimationDuration()),
  ]),
  transition('flipped => default', [
    animate(getAnimationDuration()),
  ]),
]);