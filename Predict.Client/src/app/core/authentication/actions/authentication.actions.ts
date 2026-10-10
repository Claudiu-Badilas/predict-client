import { createAction, props } from '@ngrx/store';

export const login = createAction(
  '[Authentication] Login',
  props<{ email: string; password: string }>(),
);

export const register = createAction(
  '[Authentication] Register',
  props<{ email: string; password: string }>(),
);
