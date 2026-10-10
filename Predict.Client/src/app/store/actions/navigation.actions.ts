import { createAction, props } from '@ngrx/store';

export const navigateTo = createAction(
  '[Navigation] Navigate To',
  props<{ route: string }>(),
);
