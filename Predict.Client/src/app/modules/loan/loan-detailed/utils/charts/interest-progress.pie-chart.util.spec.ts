import { describe, expect, it } from 'vitest';
import { InterestProgressChartPieUtils } from './interest-progress.pie-chart.util';
import type { HistoricalInstalmentPayment } from '../../models/base-loan-rate.model';

describe('InterestProgressChartPieUtils', () => {
  it('returns null when there is no payment progress to show', () => {
    expect(InterestProgressChartPieUtils.getChart([], [])).toBeNull();
    expect(
      InterestProgressChartPieUtils.getChart(
        [
          {
            principalAmount: 100,
            interestAmount: 10,
            insuranceCost: 0,
            instalmentPayment: false,
            earlyPayment: false,
          } as HistoricalInstalmentPayment,
        ],
        [],
      ),
    ).toBeNull();
  });

  it('returns a pie chart for paid instalments', () => {
    const chart = InterestProgressChartPieUtils.getChart(
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

    expect(chart?.chart?.type).toBe('pie');
    expect(chart?.series).toHaveLength(1);
  });
});
