import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';

export interface State {
  loading: boolean;
  minimumVisibleMs: number;
  activeOperations: number;
}

export const LayoutStore = signalStore(
  { providedIn: 'root' },
  withState<State>({ loading: false, minimumVisibleMs: 500, activeOperations: 0 }),
  withMethods((state) => ({
    spinnerOn(minimumVisibleMs = 500): void {
      patchState(state, {
        loading: true,
        minimumVisibleMs,
        activeOperations: state.activeOperations() + 1,
      });
    },
    spinnerOff(): void {
      const activeOperations = Math.max(0, state.activeOperations() - 1);
      patchState(state, { activeOperations, loading: activeOperations > 0 });
    },
  })),
);
