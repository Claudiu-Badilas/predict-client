import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  Inject,
  signal,
} from '@angular/core';
import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { LocalStorageService } from 'src/app/core/services/local-storage.service';
import * as LoanActions from 'src/app/modules/loan/actions/loan.actions';
import { LoanStore } from 'src/app/modules/loan/stores/loan.store';
import { DropdownSelectComponent } from 'src/app/shared/components/dropdown-select/dropdown-select.component';
import { NumericInputComponent } from 'src/app/shared/components/numeric-input/numeric-input.component';
import { PlatformToggleComponent } from 'src/app/shared/components/platform-toggle/platform-toggle.component';
import { TopBarComponent } from 'src/app/shared/components/top-bar/top-bar.component';
import { AppState } from 'src/app/store/app-state.reducer';
import { LoanSimulatorBodyTableComponent } from './components/loan-simulator-body-table/loan-simulator-body-table.component';
import { LoanSimulatorHeaderComponent } from './components/loan-simulator-header/loan-simulator-header.component';
import { LoanInsightsComponent } from './components/loan-simulator-insights/loan-simulator-insights.component';
import {
  InstalmentSimulationRow,
  mapInstalmentSimulations,
  SIMULATION_ROWS_STORAGE_KEY,
} from './utils/instalment-simulation.utils';

export interface SimulationRow extends InstalmentSimulationRow {
  id: string;
}

type SimulationRowForm = FormGroup<{
  id: FormControl<string>;
  monthlyAmount: FormControl<number | null>;
  payments: FormControl<number | null>;
}>;

@Component({
  selector: 'p-loan-simulator',
  imports: [
    CommonModule,
    DropdownSelectComponent,
    LoanSimulatorHeaderComponent,
    LoanSimulatorBodyTableComponent,
    LoanInsightsComponent,
    NumericInputComponent,
    TopBarComponent,
    PlatformToggleComponent,
  ],
  templateUrl: './loan-simulator.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./loan-simulator.component.scss'],
})
export class LoanSimulatorComponent {
  monthlyInstalmentBatches = this.loanStore.monthlyInstalmentBatches;
  selectedRepaymentScheduleName = this.loanStore.overviewSelectedName;
  dropDownSelectOptions = computed(() =>
    this.loanStore.repaymentSchedules().map((schedule) => schedule.name),
  );

  selectedRepaymentScheduleBase = this.loanStore.selectedOverviewSchedule;
  calculateRepaymentSchedules = this.loanStore.calculateRepaymentSchedules;

  /** LocalStorage key */
  /** Multiple simulation combinations — defaults to a single row */
  simulationRows = signal<SimulationRow[]>(this.loadRows());
  readonly simulationForm = new FormGroup({
    rows: new FormArray<SimulationRowForm>([]),
  });
  readonly simulationRowsFormArray = this.simulationForm.controls.rows;

  constructor(
    private readonly store: Store<AppState>,
    @Inject(LoanStore)
    private readonly loanStore: InstanceType<typeof LoanStore>,
    private readonly _localStorageService: LocalStorageService,
  ) {
    this.simulationRows().forEach((row) =>
      this.simulationRowsFormArray.push(this.createRowForm(row)),
    );
    this.updatePaymentValidators();
    this.simulationForm.updateValueAndValidity();
    this.simulationForm.markAllAsTouched();
    this.simulationRowsFormArray.valueChanges.subscribe(() =>
      this.syncRowsFromForm(),
    );

    // Recompute + dispatch simulation for every row whenever inputs change
    effect(() => {
      const rows = this.simulationRows();
      const schedule = this.selectedRepaymentScheduleBase();
      this.updatePaymentValidators(schedule?.monthlyInstalments.length);
      const [instalmentPayments, earlyPayments] = mapInstalmentSimulations(
        schedule,
        rows,
      );
      this.loanStore.setSimulationPayments(instalmentPayments, earlyPayments);
    });

    // Persist rows on any change
    effect(() => {
      this._localStorageService.setItem(
        SIMULATION_ROWS_STORAGE_KEY,
        this.simulationRows(),
      );
    });
  }

  // --- Row mutations ---

  addRow(): void {
    if (this.simulationForm.invalid) {
      this.simulationForm.markAllAsTouched();
      return;
    }

    this.simulationRowsFormArray.push(
      this.createRowForm(this.createEmptyRow(this.simulationRows())),
    );
    this.updatePaymentValidators();
    this.syncRowsFromForm();
  }

  removeRow(id: string): void {
    // Guard: always keep at least one combination
    if (this.simulationRows().length === 1) {
      return;
    }
    const rowIndex = this.simulationRowsFormArray.controls.findIndex(
      (row) => row.controls.id.value === id,
    );
    if (rowIndex >= 0) {
      this.simulationRowsFormArray.removeAt(rowIndex);
      this.updatePaymentValidators();
      this.syncRowsFromForm();
    }
  }

  // --- Load / persist helpers ---

  private loadRows(): SimulationRow[] {
    const stored = this._localStorageService.getItem(
      SIMULATION_ROWS_STORAGE_KEY,
    );
    if (Array.isArray(stored) && stored.length > 0) {
      return stored as SimulationRow[];
    }

    return [{ id: this.newId(), monthlyAmount: 3750, payments: 1 }];
  }

  private createEmptyRow(existing: SimulationRow[]): SimulationRow {
    // Pre-fill from the last row for convenience
    const last = existing[existing.length - 1];
    return {
      id: this.newId(),
      monthlyAmount: last?.monthlyAmount ?? 3750,
      payments: last?.payments ?? 1,
    };
  }

  private createRowForm(row: SimulationRow): SimulationRowForm {
    return new FormGroup({
      id: new FormControl(row.id, { nonNullable: true }),
      monthlyAmount: new FormControl(row.monthlyAmount, {
        validators: [Validators.required, Validators.min(1)],
      }),
      payments: new FormControl(row.payments, {
        validators: [Validators.min(1)],
      }),
    });
  }

  private updatePaymentValidators(maxPayments?: number): void {
    this.simulationRowsFormArray.controls.forEach((row, index, rows) => {
      const validators = [Validators.min(1)];
      if (maxPayments !== undefined) {
        validators.push(Validators.max(maxPayments));
      }
      if (index < rows.length - 1) {
        validators.unshift(Validators.required);
      }
      row.controls.payments.setValidators(validators);
      row.controls.payments.updateValueAndValidity({ emitEvent: false });
    });
  }

  private syncRowsFromForm(): void {
    this.simulationRows.set(this.simulationRowsFormArray.getRawValue());
  }

  private newId(): string {
    return `row_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }

  // --- Existing handlers ---

  onDropdownSelected(value: string) {
    this.loanStore.selectOverviewLoan(value);
  }

  onCalculateRepaymentSchedulesChanged(state: boolean) {
    this.loanStore.setCalculateRepaymentSchedules(state);

    this.store.dispatch(LoanActions.loadRepaymentSchedules());
  }
}
