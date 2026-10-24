import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  Inject,
} from '@angular/core';
import { Store } from '@ngrx/store';
import * as LoanActions from 'src/app/modules/loan/actions/loan.actions';
import { LoanStore } from 'src/app/modules/loan/stores/loan.store';
import { LoanInsightsComponent } from 'src/app/modules/loan/loan-simulator/components/loan-simulator-insights/loan-simulator-insights.component';
import { DropdownSelectComponent } from 'src/app/shared/components/dropdown-select/dropdown-select.component';
import { PlatformToggleComponent } from 'src/app/shared/components/platform-toggle/platform-toggle.component';
import { TopBarComponent } from 'src/app/shared/components/top-bar/top-bar.component';
import { AppState } from 'src/app/store/app-state.reducer';
import { LoanDetailedBodyComponent } from './components/loan-detailed-body/loan-detailed-body.component';
import { LoanDetailedHeaderComponent } from './components/loan-detailed-header/loan-detailed-header.component';

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
  ],
  templateUrl: './loan-detailed.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './loan-detailed.component.scss',
})
export class LoanDetailedComponent {
  selectedRepaymentScheduleName = this.loanStore.detailedSelectedName;
  dropDownSelectOptions = computed(() =>
    this.loanStore.repaymentSchedules().map((schedule) => schedule.name),
  );
  calculateRepaymentSchedules = this.loanStore.calculateRepaymentSchedules;
  includeSimulation = this.loanStore.includeDetailedSimulation;
  constructor(
    private store: Store<AppState>,
    @Inject(LoanStore)
    private readonly loanStore: InstanceType<typeof LoanStore>,
  ) {}

  onDropdownSelected(value: string) {
    this.loanStore.selectDetailedLoan(value);
  }

  onCalculateRepaymentSchedulesChanged(state: boolean) {
    this.loanStore.setCalculateRepaymentSchedules(state);

    this.store.dispatch(LoanActions.loadRepaymentSchedules());
  }

  onIncludeSimulationChanged(includeSimulation: boolean) {
    this.loanStore.setIncludeDetailedSimulation(includeSimulation);
  }
}
