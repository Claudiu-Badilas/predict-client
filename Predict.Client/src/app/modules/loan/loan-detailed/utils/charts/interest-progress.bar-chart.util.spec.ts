import { describe, expect, it } from 'vitest';
import { InterestProgressChartBarUtils } from './interest-progress.bar-chart.util';
import type { HistoricalInstalmentPayment } from '../../models/base-loan-rate.model';

describe('InterestProgressChartBarUtils', () => {
  it('returns null when there are no historical payments', () => {
    expect(InterestProgressChartBarUtils.getChart([], [])).toBeNull();
  });

  it('builds a bar chart from paid principal and interest', () => {
    const chart = InterestProgressChartBarUtils.getChart(
      [
        {
          principalAmount: 100,
          interestAmount: 10,
          insuranceCost: 2,
          instalmentPayment: true,
          earlyPayment: false,
        } as HistoricalInstalmentPayment,
      ],
      [],
    );

    expect(chart?.chart?.type).toBe('bar');
    expect(chart?.series).toHaveLength(2);
    expect(chart?.xAxis).toMatchObject({ type: 'category' });
  });
});
