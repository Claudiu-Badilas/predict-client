import { createAction, props } from '@ngrx/store';
import { ToastType } from '../models/toast-type.model';

export const showToast = createAction(
  '[Toast] Show Toast',
  props<{ message: string; toastType?: ToastType }>(),
);

export interface ToastMessage {
  message: string;
  toastType?: ToastType;
}

export const showMultipleToasts = createAction(
  '[Toast] Show Multiple Toasts',
  props<{ toasts: ToastMessage[] }>(),
);

export const dismissToast = createAction(
  '[Toast] Dismiss Toast',
  props<{ id: number }>(),
);
