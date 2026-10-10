import { createAction } from '@ngrx/store';

export const spinnerOn = createAction(
  '[Layout] Spinner On',
  (minimumVisibleMs = 500) => ({ minimumVisibleMs }),
);

export const spinnerOff = createAction('[Layout] Spinner Off');
