import { TestBed } from '@angular/core/testing';
import { ToastStore } from './toast.store';
import { ToastType } from './models/toast-type.model';
import type { Toast } from './toast.store';
import { describe, expect, it, vi } from 'vitest';
import { ToastNotificationComponent } from './toast-notification.component';
import { expectComponentCreation } from 'src/app/testing/component-test-setup';

describe('ToastNotificationComponent', () => {
  it('should create', () => {
    expectComponentCreation(ToastNotificationComponent);
  });

  it('renders toast types, dismisses interactions, and clears timers for removed messages', () => {
    expectComponentCreation(ToastNotificationComponent, (fixture) => {
      vi.useFakeTimers();
      try {
        const store = TestBed.inject(ToastStore) as unknown as {
          toasts: { set(value: Toast[]): void };
          dismiss: (id: number) => void;
        };
        const dismiss = vi.fn();
        vi.spyOn(store, 'dismiss').mockImplementation(dismiss);
        store.toasts.set([
          { id: 1, message: 'Info', toastType: ToastType.Info },
          { id: 2, message: 'Success', toastType: ToastType.Success },
          { id: 3, message: 'Warning', toastType: ToastType.Warning },
          { id: 4, message: 'Error', toastType: ToastType.Error },
          { id: 5, message: 'Removed by state', toastType: ToastType.Info },
        ]);
        fixture.detectChanges();

        const messages =
          fixture.nativeElement.querySelectorAll('.toast-message');
        expect(messages).toHaveLength(5);
        expect(messages[0].classList.contains('toast-message--info')).toBe(
          true,
        );
        expect(messages[1].classList.contains('toast-message--success')).toBe(
          true,
        );
        expect(messages[2].classList.contains('toast-message--warning')).toBe(
          true,
        );
        expect(messages[3].classList.contains('toast-message--error')).toBe(
          true,
        );

        messages[0].dispatchEvent(new MouseEvent('click', { bubbles: true }));
        messages[1].dispatchEvent(
          new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }),
        );
        messages[2].dispatchEvent(
          new KeyboardEvent('keydown', { key: ' ', bubbles: true }),
        );
        fixture.detectChanges();
        expect(dismiss).toHaveBeenCalledWith(1);
        expect(dismiss).toHaveBeenCalledWith(2);
        expect(dismiss).toHaveBeenCalledWith(3);
        fixture.componentInstance.dismiss(99);
        expect(dismiss).toHaveBeenCalledWith(99);
        dismiss.mockClear();

        store.toasts.set([
          { id: 4, message: 'Error', toastType: ToastType.Error },
        ]);
        fixture.detectChanges();
        vi.advanceTimersByTime(5000);
        expect(dismiss).toHaveBeenCalledTimes(1);
        expect(dismiss).toHaveBeenCalledWith(4);
      } finally {
        vi.useRealTimers();
      }
    });
  });
});
