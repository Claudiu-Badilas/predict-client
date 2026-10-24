import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { LocalStorageService } from 'src/app/core/services/local-storage.service';
import { LoanStore } from 'src/app/modules/loan/stores/loan.store';
import {
  InstalmentSimulationRow,
  mapInstalmentSimulations,
  SIMULATION_ROWS_STORAGE_KEY,
} from 'src/app/modules/loan/loan-simulator/utils/instalment-simulation.utils';
import { HighchartWrapperComponent } from 'src/app/shared/components/highcharts-wrapper/highcharts-wrapper.component';
import { PlatformToggleComponent } from 'src/app/shared/components/platform-toggle/platform-toggle.component';
import { Colors } from 'src/app/shared/styles/colors';
import { CompareRatesTrendChartUtils } from '../../utils/charts/compare-loan-rates-trend.chart.util';
import { InterestProgressChartBarUtils } from '../../utils/charts/interest-progress.bar-chart.util';
import { InterestProgressChartPieUtils } from '../../utils/charts/interest-progress.pie-chart.util';
import { LoanMonthlyPaymentsChartUtils } from '../../utils/charts/loan-monthly-payments.chart.util';
import { HistoricalInstalmentsTableComponent } from '../historical-instalments-table/historical-instalments-table.component';

@Component({
  selector: 'p-loan-detailed-body',
  imports: [
    CommonModule,
    HighchartWrapperComponent,
    HistoricalInstalmentsTableComponent,
    PlatformToggleComponent,
  ],
  templateUrl: './loan-detailed-body.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './loan-detailed-body.component.scss',
})
export class LoanDetailedBodyComponent {
  private readonly loanStore = inject(LoanStore);
  private readonly localStorageService = inject(LocalStorageService);

  historicalCompareToInstalmentPayments =
    this.loanStore.historicalCompareInstalments;
  detailedCompareToRepaymentSchedule = this.loanStore.detailedCompareToSchedule;
  historicalInstalments = this.loanStore.historicalInstalments;

  historicalInstalmentPaymentBatches =
    this.loanStore.historicalInstalmentPaymentBatches;
  simulationMonthlyInstalmentBatches =
    this.loanStore.simulationMonthlyInstalmentBatches;
  includeSimulation = this.loanStore.includeDetailedSimulation;
  visibleSimulationMonthlyInstalmentBatches = computed(() =>
    this.includeSimulation() ? this.simulationMonthlyInstalmentBatches() : [],
  );

  baseRepaymentSchedule = this.loanStore.baseRepaymentSchedule;
  selectedRepaymentSchedule = this.loanStore.detailedSelectedSchedule;

  interestProgressPieChart = computed(() =>
    InterestProgressChartPieUtils.getChart(
      this.historicalInstalments(),
      this.historicalCompareToInstalmentPayments(),
    ),
  );

  interestProgressBarChart = computed(() =>
    InterestProgressChartBarUtils.getChart(
      this.historicalInstalments(),
      this.historicalCompareToInstalmentPayments(),
    ),
  );

  dotBarChart = computed(() => {
    const left =
      this.selectedRepaymentSchedule() ?? this.baseRepaymentSchedule();
    const right =
      this.detailedCompareToRepaymentSchedule() ??
      this.selectedRepaymentSchedule();

    if (!left || !right) {
      return { series: [] } as any;
    }

    return CompareRatesTrendChartUtils.getChart(left, right);
  });

  loanMonthlyPaymentsChart = computed(() =>
    LoanMonthlyPaymentsChartUtils.getChart(
      this.historicalInstalments(),
      this.chartBasePaymentChange() !== 'Prd. Totala',
    ),
  );

  colors = Colors;
  chartBasePaymentChange = signal<
    | 'pie-chart'
    | 'bars-chart'
    | 'Prd. Fixa'
    | 'Prd. Totala'
    | 'dot-bar-chart'
    | 'Simulator'
  >('Simulator');

  constructor() {
    const storedRows = this.localStorageService.getItem(
      SIMULATION_ROWS_STORAGE_KEY,
    );
    const simulationRows: InstalmentSimulationRow[] =
      Array.isArray(storedRows) && storedRows.length
        ? storedRows
        : [{ monthlyAmount: 3750, payments: 1 }];

    effect(() => {
      const schedule = this.loanStore.selectedOverviewSchedule();
      if (!schedule) return;

      const [instalmentPayments, earlyPayments] = mapInstalmentSimulations(
        schedule,
        simulationRows,
      );
      this.loanStore.setSimulationPayments(instalmentPayments, earlyPayments);
    });
  }

  onChartBasePaymentChange($event: string) {
    this.chartBasePaymentChange.set(
      $event as
        | 'pie-chart'
        | 'bars-chart'
        | 'Prd. Fixa'
        | 'Prd. Totala'
        | 'dot-bar-chart'
        | 'Simulator',
    );
  }
}
