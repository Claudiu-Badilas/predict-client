import { describe, expect, it } from 'vitest';
import type { RepaymentSchedule } from '../../../models/loan.model';
import { CompareRatesTrendChartUtils } from './compare-loan-rates-trend.chart.util';

describe('CompareRatesTrendChartUtils', () => {
  it('creates principal and interest series for both repayment schedules', () => {
    const paymentDate = new Date(2024, 0, 15);
    const createSchedule = (name: string) =>
      ({
        name,
        monthlyInstalments: [
          {
            paymentDate,
            principalAmount: 50,
            interestAmount: 10,
            totalInstalment: 60,
          },
        ],
      }) as unknown as RepaymentSchedule;

    const chart = CompareRatesTrendChartUtils.getChart(
      createSchedule('Current'),
      createSchedule('Compared'),
    );
    const series = chart.series as Array<{ name: string; data: unknown[] }>;

    expect(chart.xAxis).toMatchObject({ type: 'datetime' });
    expect(series.map((item) => item.name)).toEqual([
      'Current – Principal',
      'Current – Dobanda',
      'Compared – Principal',
      'Compared – Dobanda',
    ]);
    expect(series[0].data).toHaveLength(1);
  });
});
