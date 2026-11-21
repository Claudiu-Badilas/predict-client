import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  Inject,
} from '@angular/core';
import { LoanStore } from 'src/app/modules/loan/stores/loan.store';
import { LoanInsightsComponent } from 'src/app/modules/loan/loan-simulator/components/loan-simulator-insights/loan-simulator-insights.component';
import { DropdownSelectComponent } from 'src/app/shared/components/dropdown-select/dropdown-select.component';
import { PlatformToggleComponent } from 'src/app/shared/components/platform-toggle/platform-toggle.component';
import { TopBarComponent } from 'src/app/shared/components/top-bar/top-bar.component';
import { LoanDetailedBodyComponent } from './components/loan-detailed-body/loan-detailed-body.component';
import { LoanDetailedHeaderComponent } from './components/loan-detailed-header/loan-detailed-header.component';
import { SimulationCombinationsComponent } from '../components/simulation-combinations/simulation-combinations.component';

@Component({
  selector: 'p-loan-detailed',
  imports: [
    CommonModule,
    LoanDetailedHeaderComponent,
    LoanDetailedBodyComponent,
    LoanInsightsComponent,
    DropdownSelectComponent,
    TopBarComponent,
    PlatformToggleComponent,
    SimulationCombinationsComponent,
  ],
  templateUrl: './loan-detailed.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './loan-detailed.component.scss',
})
export class LoanDetailedComponent {
  selectedRepaymentScheduleName = this.loanStore.detailedSelectedName;
  dropDownSelectOptions = computed(() =>
    this.loanStore.repaymentSchedules().map((schedule) => schedule.name),
  );
  calculateRepaymentSchedules = this.loanStore.calculateRepaymentSchedules;
  selectedOverviewSchedule = this.loanStore.selectedOverviewSchedule;
  includeSimulation = this.loanStore.includeDetailedSimulation;
  constructor(
    @Inject(LoanStore)
    private readonly loanStore: InstanceType<typeof LoanStore>,
  ) {}

  onDropdownSelected(value: string) {
    this.loanStore.selectDetailedLoan(value);
  }

  onCalculateRepaymentSchedulesChanged(state: boolean) {
    this.loanStore.setCalculateRepaymentSchedules(state);
    this.loanStore.loadRepaymentSchedules();
  }
}
