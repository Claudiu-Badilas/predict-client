import { DestroyRef, inject } from '@angular/core';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationStart,
  Router,
} from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  patchState,
  signalStore,
  withHooks,
  withMethods,
  withState,
} from '@ngrx/signals';
import { filter } from 'rxjs';

export interface State {
  loading: boolean;
  minimumVisibleMs: number;
  activeOperations: number;
}

export const LayoutStore = signalStore(
  { providedIn: 'root' },
  withState<State>({
    loading: false,
    minimumVisibleMs: 500,
    activeOperations: 0,
  }),
  withMethods((state) => ({
    beginOperation(minimumVisibleMs = 500): void {
      patchState(state, {
        loading: true,
        minimumVisibleMs,
        activeOperations: state.activeOperations() + 1,
      });
    },
    endOperation(): void {
      const activeOperations = Math.max(0, state.activeOperations() - 1);
      patchState(state, { activeOperations, loading: activeOperations > 0 });
    },
  })),
  withHooks({
    onInit(store) {
      const router = inject(Router);
      const destroyRef = inject(DestroyRef);

      router.events
        .pipe(
          filter(
            (event) =>
              event instanceof NavigationStart ||
              event instanceof NavigationEnd ||
              event instanceof NavigationCancel ||
              event instanceof NavigationError,
          ),
          takeUntilDestroyed(destroyRef),
        )
        .subscribe((event) => {
          if (event instanceof NavigationStart) store.beginOperation();
          else store.endOperation();
        });
    },
  }),
);
