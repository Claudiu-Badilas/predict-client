import Highcharts from 'highcharts';
import { DateUtils } from 'src/app/shared/utils/date.utils';
import { ReceiptsProductDomain } from '../models/receipts-products.model';

export namespace ProductPriceTrendChartUtils {
  export function getChart(
    receiptProducts: ReceiptsProductDomain[],
  ): Highcharts.Options {
    // Filter and sort products by date
    const validProducts = receiptProducts
      .filter((p) => p.price !== null)
      .sort((a, b) => a.purchasedDate.getTime() - b.purchasedDate.getTime());

    if (validProducts.length <= 1) {
      return {
        chart: { type: 'line', height: 300 },
        title: { text: 'Not enough data' },
        series: [],
        tooltip: { enabled: false },
      };
    }

    const prices = validProducts.map((p) => Number(p.price!.toFixed(2)));
    const series: Highcharts.SeriesLineOptions = {
      type: 'line',
      name: 'Price Trend',
      color: '#5b8def',
      lineWidth: 2.5,
      data: validProducts.map((p) => ({
        x: p.purchasedDate.getTime(),
        y: Number(p.price!.toFixed(2)),
        date: DateUtils.fromJsDateToString(p.purchasedDate),
        productName: p.name,
        provider: p.provider,
      })),
      marker: {
        enabled: true,
        radius: 5,
        lineWidth: 2,
        symbol: 'circle',
        states: {
          hover: {
            radius: 7,
            lineWidth: 3,
          },
        },
      },
      states: {
        hover: {
          lineWidth: 4,
        },
      },
      // Add custom tooltip for each point
      tooltip: {
        pointFormatter: function () {
          const point = this as any;
          return `
            <span style="font-weight: 700;">${point.productName}</span><br/>
            <span>${point.provider}</span><br/>
            <span style="font-size: 12px;">${point.date}</span><br/>
            <span style="font-size: 16px; font-weight: 700;">${point.y.toFixed(2)} RON</span>
          `;
        },
      },
    };

    return {
      chart: {
        type: 'spline',
        height: 286,
        backgroundColor: 'transparent',
        spacing: [12, 16, 8, 8],
      },
      title: { text: null },
      subtitle: { text: null },
      tooltip: {
        enabled: true,
        shared: false,
        borderRadius: 8,
        borderWidth: 1,
        shadow: true,
        padding: 12,
        style: {
          fontSize: '13px',
          fontFamily: 'Arial, sans-serif',
        },
        headerFormat: '',
        pointFormat: `
          <strong>{point.productName}</strong><br/>
          <strong>{point.provider}</strong><br/>
          <span style="color: #666; font-size: 12px;">{point.date}</span><br/>
          <span style="font-size: 18px; font-weight: bold; color: var(--theme-success);">{point.y:.2f}</span>
        `,
      },
      xAxis: {
        type: 'datetime',
        title: { text: null },
        gridLineWidth: 1,
        gridLineColor: 'rgb(148 163 184 / 0.16)',
        tickWidth: 0,
        lineWidth: 0,
        labels: {
          enabled: true,
          style: {
            fontSize: '10px',
          },
        },
      },
      yAxis: {
        title: { text: null },
        gridLineWidth: 1,
        gridLineColor: 'rgb(148 163 184 / 0.16)',
        lineWidth: 0,
        tickWidth: 0,
        labels: {
          enabled: true,
          style: {
            fontSize: '10px',
          },
        },
      },
      legend: { enabled: false },
      credits: { enabled: false },
      plotOptions: {
        series: {
          animation: { duration: 350 },
        },
      },
      series: [series],
    };
  }
}
