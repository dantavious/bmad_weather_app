import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';

export const flipAnimation = trigger('flip', [
  state(
    'front',
    style({
      transform: 'rotateY(0deg)',
    }),
  ),
  state(
    'back',
    style({
      transform: 'rotateY(180deg)',
    }),
  ),
  transition('front => back', [
    animate(
      '300ms cubic-bezier(0.4, 0.0, 0.2, 1)',
      style({
        transform: 'rotateY(180deg)',
      }),
    ),
  ]),
  transition('back => front', [
    animate(
      '300ms cubic-bezier(0.4, 0.0, 0.2, 1)',
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
    }),
  ),
  state(
    'flipped',
    style({
      transform: 'rotateY(180deg)',
    }),
  ),
  transition('default => flipped', [
    animate('300ms cubic-bezier(0.4, 0.0, 0.2, 1)'),
  ]),
  transition('flipped => default', [
    animate('300ms cubic-bezier(0.4, 0.0, 0.2, 1)'),
  ]),
]);