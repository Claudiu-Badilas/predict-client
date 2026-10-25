import { NumberFormatPipe } from 'src/app/shared/pipes/number-format.pipe';
import { Colors } from 'src/app/shared/styles/colors';
import { Calculator } from 'src/app/shared/utils/calculator.utils';
import { MathUtil } from 'src/app/shared/utils/math.utils';
import { ObjectUtil } from 'src/app/shared/utils/object.utils';
import { HistoricalInstalmentPayment } from '../../models/base-loan-rate.model';
import { SimulatedPaymentProjection } from './simulated-payment-projection.utils';

export namespace LoanMonthlyPaymentsChartUtils {
  export function getChart(
    instalments: HistoricalInstalmentPayment[],
    fixedPeriod: boolean,
    simulatedPayments: SimulatedPaymentProjection[] = [],
  ): Highcharts.Options | null {
    if (!instalments.length && !simulatedPayments.length) return null;

    const scheduledPayments = instalments.filter((r) => r.instalmentPayment);
    const earlyPayments = instalments.filter((r) => r.earlyPayment);
    const simulatedMonthlyTotals = getSimulatedMonthlyTotals(
      simulatedPayments,
    );
    const hasSimulatedPayments = Object.values(simulatedMonthlyTotals).some(
      (amount) => amount.normal + amount.extra > 0,
    );
    // The final historical schedule includes unpaid future projections. Once a
    // simulation is shown, use its normal and extra payments in place of those
    // projections to avoid displaying two versions of future payments.
    const unpaid = hasSimulatedPayments
      ? []
      : instalments.filter((r) => !r.earlyPayment && !r.instalmentPayment);

    const groupInstalmentsByDate = (
      instalments: HistoricalInstalmentPayment[],
    ) =>
      ObjectUtil.groupBy(instalments, (t) =>
        t.paymentDate.toLocaleString('en-US', {
          month: 'short',
          year: 'numeric',
        }),
      );

    const groupedscheduledPaymentsByMonth =
      groupInstalmentsByDate(scheduledPayments);
    const groupedEarlyPaymentsByMonth = groupInstalmentsByDate(earlyPayments);
    const groupedUnpaidByMonth = groupInstalmentsByDate(unpaid);

    const plottedHistoricalPayments = hasSimulatedPayments
      ? instalments.filter((r) => r.instalmentPayment || r.earlyPayment)
      : instalments;
    const allDates = [
      ...plottedHistoricalPayments.map((r) => r.paymentDate),
      ...simulatedPayments.map((payment) => payment.paymentDate),
    ];

    const categories = fixedPeriod
      ? getMonthsForFixedPeriod(
          allDates,
          5,
          hasSimulatedPayments
            ? simulatedPayments.at(-1)?.paymentDate
            : undefined,
        )
      : getAvailableMonths(allDates);

    const scheduledPaymentsIntrestsData = categories.map((cat) =>
      Calculator.sum(
        groupedscheduledPaymentsByMonth[cat]?.map((i) => i.interestAmount) ||
          [],
      ),
    );

    const scheduledPaymentsinsuranceCostData = categories.map((cat) =>
      Calculator.sum(
        groupedscheduledPaymentsByMonth[cat]?.map((i) => i.insuranceCost) || [],
      ),
    );

    const scheduledPaymentsPrincipalData = categories.map((cat) =>
      Calculator.sum(
        groupedscheduledPaymentsByMonth[cat]?.map((i) => i.principalAmount) ||
          [],
      ),
    );

    const earlyPaymentsData = categories.map((cat) =>
      Calculator.sum(
        groupedEarlyPaymentsByMonth[cat]?.map((i) => i.principalAmount) || [],
      ),
    );

    const unpaidPrincipalData = categories.map((cat) =>
      Calculator.sum(
        groupedUnpaidByMonth[cat]?.map((i) => i.principalAmount) || [],
      ),
    );

    const unpaidInterestData = categories.map((cat) =>
      Calculator.sum(
        groupedUnpaidByMonth[cat]?.map((i) => i.interestAmount) || [],
      ),
    );

    const unpaidInsurenceData = categories.map((cat) =>
      Calculator.sum(
        groupedUnpaidByMonth[cat]?.map((i) => i.insuranceCost) || [],
      ),
    );

    // Calculate total per category
    const totalsPerCategory = categories.map((_, index) => {
      return (
        (scheduledPaymentsPrincipalData[index] || 0) +
        (earlyPaymentsData[index] || 0) +
        (scheduledPaymentsinsuranceCostData[index] || 0) +
        (scheduledPaymentsIntrestsData[index] || 0) +
        (unpaidPrincipalData[index] || 0) +
        (unpaidInsurenceData[index] || 0) +
        (unpaidInterestData[index] || 0)
      );
    });

    const simulatedNormalPaymentsData = categories.map(
      (category) => simulatedMonthlyTotals[category]?.normal ?? 0,
    );
    const simulatedExtraPaymentsData = categories.map(
      (category) => simulatedMonthlyTotals[category]?.extra ?? 0,
    );
    const simulatedPaymentsData = categories.map(
      (_, index) =>
        simulatedNormalPaymentsData[index] + simulatedExtraPaymentsData[index],
    );
    const maxTotalsPerCategory = totalsPerCategory.map((total, index) =>
      Math.max(total, simulatedPaymentsData[index] ?? 0),
    );
    const yAxisMax = MathUtil.calculatePercentile(maxTotalsPerCategory, 90) * 1.1;
    const xAxisLabelStep =
      categories.length > 60 ? 3 : categories.length > 36 ? 2 : 1;
    const mobileXAxisLabelStep = Math.max(
      xAxisLabelStep,
      Math.ceil(categories.length / 8),
    );

    return {
      chart: { zooming: { type: 'x' } },
      title: { text: null, align: 'left' },
      xAxis: {
        categories,
        labels: {
          enabled: true,
          step: xAxisLabelStep,
          rotation: -45,
          style: { fontSize: '10px' },
        },
      },
      yAxis: {
        title: { text: null },
        max: yAxisMax,
        endOnTick: false,
      },
      plotOptions: {
        column: {
          stacking: 'normal',
          borderWidth: 0,
        },
      },
      legend: { enabled: false },
      responsive: {
        rules: [
          {
            condition: { maxWidth: 600 },
            chartOptions: {
              xAxis: {
                labels: {
                  step: mobileXAxisLabelStep,
                  rotation: -45,
                  style: { fontSize: '9px' },
                },
              },
            },
          },
        ],
      },
      tooltip: {
        shared: true,
        useHTML: true,
        formatter: function () {
          let total = 0;
          let simulatedTotal = 0;
          let category;

          const lines = this.points!.map((p) => {
            if (p.series.name.startsWith('Simulated ')) {
              simulatedTotal += p.y as number;
            } else {
              total += p.y as number;
            }
            category = p.category;

            return `
              <span style="color:${p.color}">●</span>
              ${p.series.name}: <b>${NumberFormatPipe.numberFormat(
                p.y as number,
              )}</b> RON
            `;
          });

          return `
            <b>${category}</b><br/>
            ${lines.join('<br/>')}
            <hr style="margin:4px 0"/>
            <b>Current schedule total: ${NumberFormatPipe.numberFormat(total)} RON</b>
            ${
              simulatedTotal > 0
                ? `<br/><b>Simulated total: ${NumberFormatPipe.numberFormat(
                    simulatedTotal,
                  )} RON</b>`
                : ''
            }
          `;
        },
      },
      series: [
        {
          type: 'column',
          stack: 'historical',
          name: 'Scheduled principal',
          color: Colors.GREEN_300,
          data: scheduledPaymentsPrincipalData,
          showInLegend: false,
        },
        {
          type: 'column',
          stack: 'historical',
          name: 'Early repayment',
          color: Colors.GREEN_300,
          data: earlyPaymentsData,
          showInLegend: false,
        },
        {
          type: 'column',
          stack: 'historical',
          name: 'Insurance',
          color: Colors.YELLOW_400,
          data: scheduledPaymentsinsuranceCostData,
          showInLegend: false,
        },
        {
          type: 'column',
          stack: 'historical',
          name: 'Scheduled interest',
          color: Colors.BLUE_300,
          data: scheduledPaymentsIntrestsData,
          showInLegend: false,
        },
        {
          type: 'column',
          stack: 'historical',
          name: 'Unpaid principal',
          color: Colors.BS_TEAL,
          data: unpaidPrincipalData,
          showInLegend: false,
        },
        {
          type: 'column',
          stack: 'historical',
          name: 'Unpaid insurance',
          color: Colors.YELLOW_400,
          data: unpaidInsurenceData,
          showInLegend: false,
        },
        {
          type: 'column',
          stack: 'historical',
          name: 'Unpaid interest',
          color: Colors.BS_ORANGE,
          data: unpaidInterestData,
          showInLegend: false,
        },
        ...(simulatedPaymentsData.some((amount) => amount > 0)
          ? [
              {
                type: 'column' as const,
                stack: 'simulation',
                name: 'Simulated normal payment',
                color: Colors.BS_INDIGO,
                borderColor: Colors.BS_INDIGO,
                borderWidth: 1,
                data: simulatedNormalPaymentsData,
                showInLegend: false,
              },
              {
                type: 'column' as const,
                stack: 'simulation',
                name: 'Simulated extra payment',
                color: Colors.BS_ORANGE,
                borderColor: Colors.BS_ORANGE,
                borderWidth: 1,
                data: simulatedExtraPaymentsData,
                showInLegend: false,
              },
            ]
          : []),
      ],
    };
  }

  function getSimulatedMonthlyTotals(
    payments: SimulatedPaymentProjection[],
  ): Record<string, { normal: number; extra: number }> {
    const totals: Record<string, { normal: number; extra: number }> = {};

    payments.forEach((payment) => {
      const month = payment.paymentDate.toLocaleString('en-US', {
        month: 'short',
        year: 'numeric',
      });
      const monthTotal = (totals[month] ??= { normal: 0, extra: 0 });
      monthTotal.normal += payment.normalPaymentAmount;
      monthTotal.extra += payment.extraPaymentAmount;
    });

    return totals;
  }

  function getAvailableMonths(dates: Date[]): string[] {
    if (!dates.length) return [];

    const sortedDates = [...new Set(dates)].sort(
      (d1, d2) => d1.getTime() - d2.getTime(),
    );

    const firstDate = sortedDates[0];
    const lastDate = sortedDates.at(-1);
    const result: string[] = [];

    let current = new Date(Math.min(firstDate.getTime(), lastDate.getTime()));
    const last = new Date(Math.max(firstDate.getTime(), lastDate.getTime()));

    current.setDate(1);
    last.setDate(1);

    while (current <= last) {
      result.push(
        current.toLocaleString('en-US', {
          month: 'short',
          year: 'numeric',
        }),
      );

      current = new Date(current.getFullYear(), current.getMonth() + 1, 1);
    }

    return result;
  }

  function getMonthsForFixedPeriod(
    dates: Date[],
    years: number,
    latestDate?: Date,
  ): string[] {
    if (!dates.length) return [];

    const sortedDates = [...dates].sort(
      (d1, d2) => d1.getTime() - d2.getTime(),
    );

    const firstDate = new Date(sortedDates[0]);
    const result: string[] = [];

    const current = new Date(firstDate.getFullYear(), firstDate.getMonth(), 1);

    const fixedPeriodEnd = new Date(
      firstDate.getFullYear() + years,
      firstDate.getMonth(),
      1,
    );
    const end = latestDate
      ? new Date(
          Math.min(
            fixedPeriodEnd.getTime(),
            new Date(latestDate.getFullYear(), latestDate.getMonth(), 1).getTime(),
          ),
        )
      : fixedPeriodEnd;

    while (current <= end) {
      result.push(
        current.toLocaleString('en-US', {
          month: 'short',
          year: 'numeric',
        }),
      );

      current.setMonth(current.getMonth() + 1);
    }

    return result;
  }
}
