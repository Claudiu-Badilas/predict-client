import { NumberFormatPipe } from 'src/app/shared/pipes/number-format.pipe';
import { Colors } from 'src/app/shared/styles/colors';
import { Calculator } from 'src/app/shared/utils/calculator.utils';
import { MathUtil } from 'src/app/shared/utils/math.utils';
import { ObjectUtil } from 'src/app/shared/utils/object.utils';
import { HistoricalInstalmentPayment } from '../../models/base-loan-rate.model';

export namespace LoanMonthlyPaymentsChartUtils {
  export function getChart(
    instalments: HistoricalInstalmentPayment[],
    fixedPeriod: boolean,
  ): Highcharts.Options {
    if (!instalments.length) return null;

    const scheduledPayments = instalments.filter((r) => r.instalmentPayment);
    const earlyPayments = instalments.filter((r) => r.earlyPayment);
    const unpaid = instalments.filter(
      (r) => !r.earlyPayment && !r.instalmentPayment,
    );

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

    const allDates = instalments.map((r) => r.paymentDate);

    const categories = fixedPeriod
      ? getMonthsForFixedPeriod(allDates, 5)
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

    const yAxisMax = MathUtil.calculatePercentile(totalsPerCategory, 90) * 1.1;

    return {
      chart: { zooming: { type: 'x' } },
      title: { text: null, align: 'left' },
      xAxis: { categories, labels: { enabled: false } },
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
      tooltip: {
        shared: true,
        useHTML: true,
        formatter: function () {
          let total = 0;
          let category;

          const lines = this.points!.map((p) => {
            total += p.y as number;
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
            <b>Total: ${NumberFormatPipe.numberFormat(total)} RON</b>
          `;
        },
      },
      series: [
        {
          type: 'column',
          name: 'Principal Rata',
          color: Colors.GREEN_300,
          data: scheduledPaymentsPrincipalData,
          showInLegend: false,
        },
        {
          type: 'column',
          name: 'Anticipat',
          color: Colors.GREEN_300,
          data: earlyPaymentsData,
          showInLegend: false,
        },
        {
          type: 'column',
          name: 'Asig.',
          color: Colors.YELLOW_400,
          data: scheduledPaymentsinsuranceCostData,
          showInLegend: false,
        },
        {
          type: 'column',
          name: 'Dobanda Rata',
          color: Colors.BLUE_300,
          data: scheduledPaymentsIntrestsData,
          showInLegend: false,
        },
        {
          type: 'column',
          name: 'Principal Neplatit',
          color: Colors.BS_TEAL,
          data: unpaidPrincipalData,
          showInLegend: false,
        },
        {
          type: 'column',
          name: 'Asig. Neplatita',
          color: Colors.YELLOW_400,
          data: unpaidInsurenceData,
          showInLegend: false,
        },
        {
          type: 'column',
          name: 'Dobanda Neplatita',
          color: Colors.BS_ORANGE,
          data: unpaidInterestData,
          showInLegend: false,
        },
      ],
    };
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

  function getMonthsForFixedPeriod(dates: Date[], years: number): string[] {
    if (!dates.length) return [];

    const sortedDates = [...dates].sort(
      (d1, d2) => d1.getTime() - d2.getTime(),
    );

    const firstDate = new Date(sortedDates[0]);
    const result: string[] = [];

    const current = new Date(firstDate.getFullYear(), firstDate.getMonth(), 1);

    const end = new Date(
      firstDate.getFullYear() + years,
      firstDate.getMonth(),
      1,
    );

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
