import { Injectable, signal } from '@angular/core';
import { LocalStorageService } from 'src/app/core/services/local-storage.service';
import { InstalmentSimulationRow, SIMULATION_ROWS_STORAGE_KEY } from '../../loan-simulator/utils/instalment-simulation.utils';

export interface SimulationCombination extends InstalmentSimulationRow {
  id: string;
}

@Injectable({ providedIn: 'root' })
export class SimulationCombinationsStore {
  readonly rows = signal<SimulationCombination[]>(this.loadRows());

  constructor(private readonly localStorage: LocalStorageService) {}

  setRows(rows: SimulationCombination[]): void {
    this.rows.set(rows);
    this.localStorage.setItem(SIMULATION_ROWS_STORAGE_KEY, rows);
  }

  private loadRows(): SimulationCombination[] {
    const stored = this.localStorage.getItem(SIMULATION_ROWS_STORAGE_KEY);
    if (Array.isArray(stored) && stored.length) return stored as SimulationCombination[];
    return [{ id: this.newId(), monthlyAmount: 3750, payments: 1 }];
  }

  private newId(): string {
    return `row_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }
}
