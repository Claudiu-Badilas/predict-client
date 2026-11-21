import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { LoanStore } from 'src/app/modules/loan/stores/loan.store';
import { SimulationCombinationsStore } from 'src/app/modules/loan/components/simulation-combinations/simulation-combinations.store';
import { HighchartWrapperComponent } from 'src/app/shared/components/highcharts-wrapper/highcharts-wrapper.component';
import { PlatformToggleComponent } from 'src/app/shared/components/platform-toggle/platform-toggle.component';
import { CompareRatesTrendChartUtils } from '../../utils/charts/compare-loan-rates-trend.chart.util';
import { InterestProgressChartBarUtils } from '../../utils/charts/interest-progress.bar-chart.util';
import { InterestProgressChartPieUtils } from '../../utils/charts/interest-progress.pie-chart.util';
import { LoanMonthlyPaymentsChartUtils } from '../../utils/charts/loan-monthly-payments.chart.util';
import { SimulatedPaymentProjectionUtils } from '../../utils/charts/simulated-payment-projection.utils';
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
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './loan-detailed-body.component.scss',
})
export class LoanDetailedBodyComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly loanStore = inject(LoanStore);
  private readonly combinationsStore = inject(SimulationCombinationsStore);
  private readonly routeQueryParams = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });

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
  simulatedRemainingPayments = computed(() =>
    this.includeSimulation()
      ? SimulatedPaymentProjectionUtils.getRemainingPayments(
          this.historicalInstalments(),
          this.combinationsStore.rows(),
        )
      : [],
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
      this.includeSimulation(),
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
      this.simulatedRemainingPayments(),
    ),
  );

  readonly chartBasePaymentChange = computed<
    'pie-chart' | 'bars-chart' | 'Prd. Fixa' | 'Prd. Totala' | 'dot-bar-chart'
  >(
    () =>
      this.fromQuerySelection(this.routeQueryParams().get('chartSelection')) ??
      'pie-chart',
  );

  constructor() {
    // Keep the URL canonical when it is missing or contains a legacy alias.
    // Navigation is the side effect; the selected chart itself is computed from the route.
    effect(() => {
      const querySelection = this.routeQueryParams().get('chartSelection');
      const selection = this.fromQuerySelection(querySelection) ?? 'pie-chart';
      if (querySelection !== this.toQuerySelection(selection)) {
        this.persistChartSelection(selection);
      }
    });
  }

  onChartBasePaymentChange($event: string) {
    if (this.isChartSelection($event)) this.persistChartSelection($event);
  }

  onIncludeSimulationChanged(includeSimulation: boolean): void {
    this.loanStore.setIncludeDetailedSimulation(includeSimulation);
  }

  private isChartSelection(value: string | null): value is ChartSelection {
    return (
      value === 'pie-chart' ||
      value === 'bars-chart' ||
      value === 'Prd. Fixa' ||
      value === 'Prd. Totala' ||
      value === 'dot-bar-chart'
    );
  }

  private fromQuerySelection(value: string | null): ChartSelection | null {
    switch (value) {
      case 'pie-chart':
        return 'pie-chart';
      case 'bar-chart':
      case 'bars-chart':
        return 'bars-chart';
      case 'payments-5-years':
      case 'Prd. Fixa':
        return 'Prd. Fixa';
      case 'payments-full-term':
      case 'Prd. Totala':
        return 'Prd. Totala';
      case 'rate-comparison':
      case 'dot-bar-chart':
        return 'dot-bar-chart';
      default:
        return null;
    }
  }

  private toQuerySelection(selection: ChartSelection): string {
    switch (selection) {
      case 'pie-chart':
        return 'pie-chart';
      case 'bars-chart':
        return 'bar-chart';
      case 'Prd. Fixa':
        return 'payments-5-years';
      case 'Prd. Totala':
        return 'payments-full-term';
      case 'dot-bar-chart':
        return 'rate-comparison';
    }
  }

  private persistChartSelection(selection: ChartSelection): void {
    if (
      this.route.snapshot.queryParamMap.get('chartSelection') ===
      this.toQuerySelection(selection)
    ) {
      return;
    }
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { chartSelection: this.toQuerySelection(selection) },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }
}

type ChartSelection =
  'pie-chart' | 'bars-chart' | 'Prd. Fixa' | 'Prd. Totala' | 'dot-bar-chart';
