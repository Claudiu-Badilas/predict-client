import Highcharts from 'highcharts';
import { Colors } from 'src/app/shared/styles/colors';
import { DateUtils } from 'src/app/shared/utils/date.utils';
import { JsDateUtils } from 'src/app/shared/utils/js-date.utils';
import { RepaymentSchedule } from '../../../models/loan.model';

export namespace CompareRatesTrendChartUtils {
  export function getChart(
    left: RepaymentSchedule,
    right: RepaymentSchedule,
  ): Highcharts.Options {
    const sources: Array<[RepaymentSchedule, string, string]> = [
      left ? [left, left.name, Colors.BS_TEAL] : null,
      right ? [right, right.name, Colors.PINK_500] : null,
    ].filter(Boolean) as Array<[RepaymentSchedule, string, string]>;

    const leftStatDate = left.monthlyInstalments[0].paymentDate;
    const rightStatDate = right.monthlyInstalments[0].paymentDate;

    const startDate = JsDateUtils.isAfter(leftStatDate, rightStatDate)
      ? leftStatDate
      : rightStatDate;

    const series: Highcharts.SeriesOptionsType[] = [];

    sources.forEach(([repaymentSchedule, name, color]) => {
      // Principal series - solid line
      const principalSeries: Highcharts.SeriesLineOptions = {
        type: 'line',
        name: `${name} – Principal`,
        color,
        data: repaymentSchedule.monthlyInstalments
          .filter((i) => JsDateUtils.isSameOrAfter(i.paymentDate, startDate))
          .map((r, index) => ({
            x: r.paymentDate.getTime(),
            y: Number(r.principalAmount.toFixed(2)),
            date: DateUtils.fromJsDateToString(r.paymentDate),
            instalment: index + 1,
            totalInstalment: Number(r.totalInstalment.toFixed(2)),
          })),
      };

      // Interest series - dashed line
      const interestSeries: Highcharts.SeriesLineOptions = {
        type: 'line',
        name: `${name} – Dobanda`,
        color,
        dashStyle: 'ShortDash',
        data: repaymentSchedule.monthlyInstalments
          .filter((i) => JsDateUtils.isSameOrAfter(i.paymentDate, startDate))
          .map((r, index) => ({
            x: r.paymentDate.getTime(),
            y: Number(r.interestAmount.toFixed(2)),
            date: DateUtils.fromJsDateToString(r.paymentDate),
            instalment: index + 1,
            totalInstalment: Number(r.totalInstalment.toFixed(2)),
          })),
      };

      series.push(principalSeries);
      series.push(interestSeries);
    });

    return {
      title: { text: null, align: 'left' },
      chart: { zooming: { type: 'x' } },
      xAxis: { type: 'datetime' },
      yAxis: {
        title: { text: null },
        labels: {
          formatter: function () {
            const value = this.value as number;
            if (value >= 1000) {
              return value / 1000 + 'k';
            }
            return value.toString();
          },
        },
      },
      plotOptions: { series: { marker: { enabled: false } } },
      tooltip: {
        shared: true,
        useHTML: true,
        formatter: function () {
          const points = (this as any).points;
          if (!points || points.length === 0) return '';

          const firstPoint = points[0]?.point;
          const date = firstPoint?.date || '';

          // Separate principal and interest points
          const principalPoints = points.filter((p: any) =>
            p.series.name.includes('Principal'),
          );
          const interestPoints = points.filter((p: any) =>
            p.series.name.includes('Dobanda'),
          );

          let tooltipHtml = `
      <div style="color: var(--theme-text-primary);">
        <b style="font-size: 11px;"> Date: ${date}</b>
    `;

          // === PRINCIPAL AREA ===
          if (principalPoints.length > 0) {
            tooltipHtml += `
        <div style="margin: 6px 0; padding: 8px; background: var(--theme-accent-subtle); border-radius: 6px; border-left: 4px solid var(--theme-accent);">
       `;

            principalPoints.forEach((p: any) => {
              const sourceName = p.series.name.split(' – ')[0] || p.series.name;
              tooltipHtml += `
          <div style="display: flex; justify-content: space-between;">
            <span>
              <span style="color:${p.series.color}; font-weight: bold;">●</span>
              Principal - ${sourceName}:
            </span>
            <span><b>${p.y.toFixed(2)}</b></span>
          </div>
        `;
            });

            tooltipHtml += `</div>`;
          }

          // === INTEREST AREA ===
          if (interestPoints.length > 0) {
            tooltipHtml += `
        <div style="margin: 6px 0; padding: 8px; background: var(--theme-danger-subtle); border-radius: 6px; border-left: 4px solid var(--theme-danger);">
       `;

            interestPoints.forEach((p: any) => {
              const sourceName = p.series.name.split(' – ')[0] || p.series.name;
              tooltipHtml += `
          <div style="display: flex; justify-content: space-between;">
            <span>
              <span style="color:${p.series.color}; font-weight: bold;">─</span>
              Dobanda - ${sourceName}:
            </span>
            <span><b>${p.y.toFixed(2)}</b></span>
          </div>
        `;
            });

            tooltipHtml += `</div>`;
          }

          tooltipHtml += `</div>`;
          return tooltipHtml;
        },
      },
      legend: { enabled: false },
      series,
    };
  }
}
