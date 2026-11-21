import { inject } from '@angular/core';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { LocalStorageService } from 'src/app/core/services/local-storage.service';
import {
  InstalmentSimulationRow,
  SIMULATION_ROWS_STORAGE_KEY,
} from '../../loan-simulator/utils/instalment-simulation.utils';

export interface SimulationCombination extends InstalmentSimulationRow {
  id: string;
}

export const SimulationCombinationsStore = signalStore(
  { providedIn: 'root' },
  withState(() => ({ rows: loadRows(inject(LocalStorageService)) })),
  withMethods((store, localStorage = inject(LocalStorageService)) => ({
    setRows(rows: SimulationCombination[]): void {
      patchState(store, { rows });
      localStorage.setItem(SIMULATION_ROWS_STORAGE_KEY, rows);
    },
  })),
);

function loadRows(localStorage: LocalStorageService): SimulationCombination[] {
  const stored = localStorage.getItem(SIMULATION_ROWS_STORAGE_KEY);
  if (Array.isArray(stored) && stored.length)
    return stored as SimulationCombination[];
  return [{ id: newId(), monthlyAmount: 3750, payments: 1 }];
}

function newId(): string {
  return `row_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
