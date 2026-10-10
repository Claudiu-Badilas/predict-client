import { SeriesOptionsType } from 'highcharts';
import { NumberFormatPipe } from 'src/app/shared/pipes/number-format.pipe';
import { Colors } from 'src/app/shared/styles/colors';
import { Calculator } from 'src/app/shared/utils/calculator.utils';
import { MathUtil } from 'src/app/shared/utils/math.utils';
import { HistoricalInstalmentPayment } from '../../models/base-loan-rate.model';

export namespace InterestProgressChartBarUtils {
  export function getChart(
    rates: HistoricalInstalmentPayment[],
    compareToRates: HistoricalInstalmentPayment[],
  ): Highcharts.Options {
    if (!rates.length) return null;

    const paidRates = rates.filter(
      (r) => r.instalmentPayment || r.earlyPayment,
    );
    const unpaidRates = rates.filter(
      (r) => !r.instalmentPayment && !r.earlyPayment,
    );

    const paidPrincipal = Calculator.sum(
      paidRates.map((r) => r.principalAmount),
    );
    const unpaidPrincipal = Calculator.sum(
      unpaidRates.map((r) => r.principalAmount),
    );

    const paidInterestRates = rates.filter((r) => r.instalmentPayment);
    const paidInterest = Calculator.sum(
      paidInterestRates.map((r) => r.interestAmount),
    );

    const paidInsurance = Calculator.sum(
      paidInterestRates.map((r) => r.insuranceCost),
    );

    const savedInterestRates = rates.filter((r) => r.earlyPayment);
    const savedInterest = Calculator.sum(
      savedInterestRates.map((r) => r.interestAmount),
    );

    const unpaidInterest = Calculator.sum(
      unpaidRates.map((r) => r.interestAmount),
    );

    const comparePaidRates =
      compareToRates?.filter((r) => r.instalmentPayment || r.earlyPayment) ||
      [];
    const compareUnpaidRates =
      compareToRates?.filter((r) => !r.instalmentPayment && !r.earlyPayment) ||
      [];

    const comparePaidPrincipal = Calculator.sum(
      comparePaidRates.map((r) => r.principalAmount),
    );
    const compareUnpaidPrincipal = Calculator.sum(
      compareUnpaidRates.map((r) => r.principalAmount),
    );

    const comparePaidInterestRates =
      compareToRates?.filter((r) => r.instalmentPayment) || [];
    const comparePaidInterest = Calculator.sum(
      comparePaidInterestRates.map((r) => r.interestAmount),
    );

    const comparePaidInsurance = Calculator.sum(
      comparePaidInterestRates.map((r) => r.insuranceCost),
    );

    const compareSavedInterestRates =
      compareToRates?.filter((r) => r.earlyPayment) || [];
    const compareSavedInterest = Calculator.sum(
      compareSavedInterestRates.map((r) => r.interestAmount),
    );

    const compareUnpaidInterest = Calculator.sum(
      compareUnpaidRates.map((r) => r.interestAmount),
    );

    const isMobile = window.innerWidth < 768;

    const categories = [
      {
        id: 'paidPrincipal',
        label: !isMobile ? 'Principal Platit' : 'PP',
        color: Colors.TEAL_400,
      },
      {
        id: 'unpaidPrincipal',
        label: !isMobile ? 'Principal Neplatit' : 'PN',
        color: Colors.BS_DANGER,
      },
      {
        id: 'paidInterest',
        label: !isMobile ? 'Dobanda Platita' : 'DP',
        color: Colors.BLUE_400,
      },
      {
        id: 'paidInsurance',
        label: !isMobile ? 'Asig. Platita' : 'Asig.',
        color: Colors.YELLOW_400,
      },
      {
        id: 'savedInterest',
        label: !isMobile ? 'Economii' : 'E',
        color: Colors.GREEN_400,
      },
      {
        id: 'unpaidInterest',
        label: !isMobile ? 'Dobanda Neplatita' : 'DN',
        color: Colors.BS_ORANGE,
      },
    ];

    const valuesMap = {
      paidPrincipal,
      unpaidPrincipal,
      paidInterest,
      paidInsurance,
      savedInterest,
      unpaidInterest,
    };

    const compareValuesMap = {
      paidPrincipal: comparePaidPrincipal,
      unpaidPrincipal: compareUnpaidPrincipal,
      paidInterest: comparePaidInterest,
      paidInsurance: comparePaidInsurance,
      savedInterest: compareSavedInterest,
      unpaidInterest: compareUnpaidInterest,
    };

    const hasCompareData = compareToRates && compareToRates.length > 0;

    const mainData = categories
      .map((cat) => ({
        ...cat,
        value: valuesMap[cat.id as keyof typeof valuesMap] || 0,
        compareValue: hasCompareData
          ? compareValuesMap[cat.id as keyof typeof compareValuesMap] || 0
          : undefined,
      }))
      .sort((a, b) => b.value - a.value);

    const barChartData = mainData.map((d) => ({
      name: d.label,
      nameShort: d.label,
      y: MathUtil.round(d.value),
      amount: MathUtil.round(d.value),
      amountCompact: NumberFormatPipe.numberFormat(d.value),
      color: d.color,
      compareAmount:
        d.compareValue !== undefined
          ? MathUtil.round(d.compareValue)
          : undefined,
      compareAmountCompact:
        d.compareValue !== undefined
          ? NumberFormatPipe.numberFormat(d.compareValue)
          : undefined,
    }));

    const compareData = barChartData.map((d, index) => ({
      ...d,
      y: d.compareAmount || 0,
      color: d.color + '80',
      amountCompact:
        d.compareAmount !== undefined && d.compareAmount > 0
          ? NumberFormatPipe.numberFormat(d.compareAmount)
          : '0',
    }));

    const allValues = [
      ...barChartData.map((d) => d.y),
      ...compareData.map((d) => d.y),
    ];
    const maxY = Math.max(...allValues, 1);

    return {
      chart: {
        type: 'bar',
        spacing: [20, 20, 20, 20],
        height: Math.max(400, barChartData.length * 60 + 120),
      },
      title: { text: null, align: 'left' },
      legend: {
        enabled: hasCompareData,
        layout: 'horizontal',
        align: 'center',
        verticalAlign: 'bottom',
        itemStyle: {
          fontSize: '9px',
          fontWeight: 'normal',
        },
        symbolRadius: 2,
        symbolHeight: 10,
        symbolWidth: 10,
      },
      tooltip: {
        enabled: true,
        formatter: function (this: any) {
          const point = this.point;

          const mainPoint = this.series.chart.series[0]?.data?.find(
            (p: any) => p.name === point.name,
          );
          const comparePoint = this.series.chart.series[1]?.data?.find(
            (p: any) => p.name === point.name,
          );

          const mainValue = mainPoint?.y || 0;
          const compareValue = comparePoint?.y || 0;

          let tooltipText = `<div >`;

          tooltipText += `
            <div style="display:flex; justify-content:space-between; width:100%;">
              <span>${point.name}:</span>
              <span><b>${NumberFormatPipe.numberFormat(mainValue)}</b></span>
            </div></br>`;

          if (compareValue > 0) {
            tooltipText += `
              <div style="display:flex; justify-content:space-between; width:100%;">
                <span>Referinta:</span>
                <span><b>${NumberFormatPipe.numberFormat(compareValue)}</b></span>
              </div></br>`;

            const diff = mainValue - compareValue;
            if (diff !== 0) {
              const diffFormatted = NumberFormatPipe.numberFormat(
                Math.abs(diff),
              );
              const diffPercent =
                compareValue > 0
                  ? ((diff / compareValue) * 100).toFixed(1)
                  : '0';
              const sign = diff < 0 ? '' : '+';
              const color =
                diff < 0 ? 'var(--theme-danger)' : 'var(--theme-success)';
              const arrow = diff < 0 ? '▼' : '▲';

              tooltipText += `
                <div style="display:flex; justify-content:space-between; width:100%;">
                  <span>Diferenta:</span>
                  <span style="color:${color};font-weight:bold;">${arrow} ${sign}${diffFormatted} (${sign}${diffPercent}%)</span>
                </div>`;
            }
          }

          tooltipText += `</div>`;
          return tooltipText;
        },
        borderWidth: 1,
        borderRadius: 6,
        shadow: true,
        style: { fontSize: '11px' },
        padding: 8,
      },
      xAxis: {
        type: 'category',
        categories: barChartData.map((d) => d.name),
        title: { text: null },
        labels: {
          style: {
            fontSize: isMobile ? '8px' : '9px',
            fontWeight: 'normal',
          },
        },
      },
      yAxis: {
        title: { text: null },
        labels: {
          enabled: true,
          formatter: function (this: any) {
            return NumberFormatPipe.numberFormat(this.value);
          },
          style: { fontSize: '7px' },
        },
        min: 0,
        max: maxY * 1.2,
        gridLineWidth: 0.5,
      },
      plotOptions: {
        bar: {
          borderRadius: 3,
          dataLabels: {
            enabled: true,
            format: '{point.amountCompact}',
            style: {
              fontSize: '8px',
              fontWeight: 'bold',
              color: 'var(--theme-text-primary)',
              textOutline: 'none',
            },
            position: 'right',
            overflow: 'allow',
            crop: false,
          },
        },
      },
      series: [
        {
          type: 'bar',
          name: 'Principal',
          data: barChartData.map((d, index) => ({
            ...d,
            color: d.color,
          })),
          colorByPoint: true,
          colors: barChartData.map((d) => d.color),
          showInLegend: false,
          pointWidth: isMobile ? 16 : 22,
          pointPadding: hasCompareData ? 0.35 : 0.3,
          groupPadding: 0.15,
          zIndex: 2,
          borderWidth: 0,
        } as SeriesOptionsType,
        ...(hasCompareData
          ? [
              {
                type: 'bar',
                name: 'Comparatie',
                data: compareData.map((d, index) => ({
                  ...d,
                  y: d.y,
                  color: d.color,
                  amount: d.y,
                  amountCompact: NumberFormatPipe.numberFormat(d.y),
                })),
                colorByPoint: true,
                colors: compareData.map((d) => d.color),
                pointWidth: isMobile ? 8 : 12,
                pointPadding: hasCompareData ? 0.35 : 0.3,
                groupPadding: 0.15,
                opacity: 0.7,
                zIndex: 1,
                borderWidth: 0,
                showInLegend: false,
                dataLabels: {
                  enabled: true,
                  format: '{point.amountCompact}',
                  style: {
                    fontSize: isMobile ? '7px' : '8px',
                  },
                  position: 'right',
                  overflow: 'allow',
                  crop: false,
                },
              } as SeriesOptionsType,
            ]
          : []),
      ],
    };
  }
}
