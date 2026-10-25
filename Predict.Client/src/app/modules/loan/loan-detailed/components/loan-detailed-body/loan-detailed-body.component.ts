import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { LoanStore } from 'src/app/modules/loan/stores/loan.store';
import {
  mapInstalmentSimulations,
} from 'src/app/modules/loan/loan-simulator/utils/instalment-simulation.utils';
import { SimulationCombinationsStore } from 'src/app/modules/loan/components/simulation-combinations/simulation-combinations.store';
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
  private readonly combinationsStore = inject(SimulationCombinationsStore);

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
      this.includeSimulation()
        ? this.simulationMonthlyInstalmentBatches().flatMap(
            (batch) => batch.instalments,
          )
        : [],
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
    effect(() => {
      const schedule = this.loanStore.selectedOverviewSchedule();
      const simulationRows = this.combinationsStore.rows();
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
