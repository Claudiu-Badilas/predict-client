import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { LoanStore } from 'src/app/modules/loan/stores/loan.store';
import { DropdownSelectComponent } from 'src/app/shared/components/dropdown-select/dropdown-select.component';
import { PlatformToggleComponent } from 'src/app/shared/components/platform-toggle/platform-toggle.component';
import { TopBarComponent } from 'src/app/shared/components/top-bar/top-bar.component';
import { LoanSimulatorBodyTableComponent } from './components/loan-simulator-body-table/loan-simulator-body-table.component';
import { LoanSimulatorHeaderComponent } from './components/loan-simulator-header/loan-simulator-header.component';
import { LoanInsightsComponent } from './components/loan-simulator-insights/loan-simulator-insights.component';
import { SimulationCombinationsComponent } from '../components/simulation-combinations/simulation-combinations.component';

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
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./loan-simulator.component.scss'],
})
export class LoanSimulatorComponent {
  private readonly loanStore = inject(LoanStore);
  monthlyInstalmentBatches = this.loanStore.monthlyInstalmentBatches;
  selectedRepaymentScheduleName = this.loanStore.overviewSelectedName;
  dropDownSelectOptions = computed(() =>
    this.loanStore.repaymentSchedules().map((schedule) => schedule.name),
  );
  selectedRepaymentScheduleBase = this.loanStore.selectedOverviewSchedule;
  calculateRepaymentSchedules = this.loanStore.calculateRepaymentSchedules;

  onDropdownSelected(value: string) {
    this.loanStore.selectOverviewLoan(value);
  }

  onCalculateRepaymentSchedulesChanged(state: boolean) {
    this.loanStore.setCalculateRepaymentSchedules(state);
    this.loanStore.loadRepaymentSchedules();
  }
}
