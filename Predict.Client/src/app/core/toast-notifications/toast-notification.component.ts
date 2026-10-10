import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
} from '@angular/core';
import { ToastStore } from './toast.store';

@Component({
  selector: 'p-toast',
  imports: [CommonModule],
  templateUrl: './toast-notification.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./toast-notification.component.scss'],
})
export class ToastNotificationComponent {
  private readonly toastStore = inject(ToastStore);
  readonly toast = this.toastStore.toasts;
  private readonly dismissTimers = new Map<
    number,
    ReturnType<typeof setTimeout>
  >();

  constructor() {
    effect(() => {
      const toasts = this.toastStore.toasts();
      const activeIds = new Set(toasts.map(({ id }) => id));
      for (const [id, timer] of this.dismissTimers) {
        if (!activeIds.has(id)) {
          clearTimeout(timer);
          this.dismissTimers.delete(id);
        }
      }
      for (const { id } of toasts) {
        if (!this.dismissTimers.has(id)) {
          this.dismissTimers.set(
            id,
            setTimeout(() => this.dismiss(id), 5000),
          );
        }
      }
    });
  }

  dismiss(id: number): void {
    const timer = this.dismissTimers.get(id);
    if (timer) clearTimeout(timer);
    this.dismissTimers.delete(id);
    this.toastStore.dismiss(id);
  }
}
