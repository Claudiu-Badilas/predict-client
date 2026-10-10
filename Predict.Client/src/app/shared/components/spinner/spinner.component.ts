import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  signal,
} from '@angular/core';
import { LayoutStore } from 'src/app/store/reducers/layout.reducer';

@Component({
  selector: 'p-spinner',
  imports: [CommonModule],
  templateUrl: './spinner.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./spinner.component.scss'],
})
export class SpinnerComponent {
  private readonly layoutStore = inject(LayoutStore);
  private readonly destroyRef = inject(DestroyRef);
  private readonly isLoading = this.layoutStore.loading;
  private readonly minimumVisibleMs = this.layoutStore.minimumVisibleMs;
  readonly isVisible = signal(false);
  private shownAt = 0;
  private hideTimer?: ReturnType<typeof setTimeout>;

  constructor() {
    effect(() => {
      const loading = this.isLoading();
      const minimumVisibleMs = this.minimumVisibleMs();
      if (this.hideTimer) {
        clearTimeout(this.hideTimer);
        this.hideTimer = undefined;
      }

      if (loading) {
        this.shownAt = Date.now();
        this.isVisible.set(true);
        return;
      }

      if (!this.shownAt) {
        this.isVisible.set(false);
        return;
      }

      const remaining = minimumVisibleMs - (Date.now() - this.shownAt);
      if (remaining > 0) {
        this.hideTimer = setTimeout(() => {
          this.hideTimer = undefined;
          this.shownAt = 0;
          this.isVisible.set(false);
        }, remaining);
      } else {
        this.shownAt = 0;
        this.isVisible.set(false);
      }
    });

    this.destroyRef.onDestroy(() => {
      if (this.hideTimer) clearTimeout(this.hideTimer);
    });
  }
}
