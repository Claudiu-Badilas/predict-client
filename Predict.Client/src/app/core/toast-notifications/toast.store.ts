import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { ToastType } from './models/toast-type.model';

export interface Toast {
  id: number;
  message: string;
  toastType: ToastType;
}

export const ToastStore = signalStore(
  { providedIn: 'root' },
  withState<{ toasts: Toast[]; nextId: number }>({ toasts: [], nextId: 1 }),
  withMethods((state) => ({
    show(message: string, toastType = ToastType.Info): void {
      patchState(state, (current) => ({
        toasts: [...current.toasts, { id: current.nextId, message, toastType }],
        nextId: current.nextId + 1,
      }));
    },
    showMany(messages: { message: string; toastType?: ToastType }[]): void {
      patchState(state, (current) => ({
        toasts: [
          ...current.toasts,
          ...messages.map((toast, index) => ({
            id: current.nextId + index,
            message: toast.message,
            toastType: toast.toastType ?? ToastType.Info,
          })),
        ],
        nextId: current.nextId + messages.length,
      }));
    },
    dismiss(id: number): void {
      patchState(state, (current) => ({
        toasts: current.toasts.filter((toast) => toast.id !== id),
      }));
    },
  })),
);
