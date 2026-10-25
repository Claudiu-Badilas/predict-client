import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  Inject,
} from '@angular/core';
import { Store } from '@ngrx/store';
import * as LoanActions from 'src/app/modules/loan/actions/loan.actions';
import { LoanStore } from 'src/app/modules/loan/stores/loan.store';
import { DropdownSelectComponent } from 'src/app/shared/components/dropdown-select/dropdown-select.component';
import { PlatformToggleComponent } from 'src/app/shared/components/platform-toggle/platform-toggle.component';
import { TopBarComponent } from 'src/app/shared/components/top-bar/top-bar.component';
import { AppState } from 'src/app/store/app-state.reducer';
import { LoanSimulatorBodyTableComponent } from './components/loan-simulator-body-table/loan-simulator-body-table.component';
import { LoanSimulatorHeaderComponent } from './components/loan-simulator-header/loan-simulator-header.component';
import { LoanInsightsComponent } from './components/loan-simulator-insights/loan-simulator-insights.component';
import { mapInstalmentSimulations } from './utils/instalment-simulation.utils';
import { SimulationCombinationsComponent } from '../components/simulation-combinations/simulation-combinations.component';
import { SimulationCombinationsStore } from '../components/simulation-combinations/simulation-combinations.store';

@Component({
  selector: 'p-loan-simulator',
  imports: [
    CommonModule,
    DropdownSelectComponent,
    LoanSimulatorHeaderComponent,
    LoanSimulatorBodyTableComponent,
    LoanInsightsComponent,
    SimulationCombinationsComponent,
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

  simulationRows = this.combinationsStore.rows;

  constructor(
    private readonly store: Store<AppState>,
    @Inject(LoanStore)
    private readonly loanStore: InstanceType<typeof LoanStore>,
    private readonly combinationsStore: SimulationCombinationsStore,
  ) {
    // Recompute + dispatch simulation for every row whenever inputs change
    effect(() => {
      const rows = this.simulationRows();
      const schedule = this.selectedRepaymentScheduleBase();
      const [instalmentPayments, earlyPayments] = mapInstalmentSimulations(
        schedule,
        rows,
      );
      this.loanStore.setSimulationPayments(instalmentPayments, earlyPayments);
    });

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
