import { describe, expect, it } from 'vitest';
import { LoanMonthlyPaymentsChartUtils } from './loan-monthly-payments.chart.util';
import type { HistoricalInstalmentPayment } from '../../models/base-loan-rate.model';

describe('LoanMonthlyPaymentsChartUtils', () => {
  it('returns null without historical or simulated payments', () => {
    expect(LoanMonthlyPaymentsChartUtils.getChart([], false)).toBeNull();
  });

  it('creates monthly categories and stacked payment series', () => {
    const chart = LoanMonthlyPaymentsChartUtils.getChart(
      [
        {
          paymentDate: new Date(2024, 0, 15),
          principalAmount: 90,
          interestAmount: 10,
          insuranceCost: 2,
          instalmentPayment: true,
          earlyPayment: false,
        } as HistoricalInstalmentPayment,
      ],
      false,
    );
    const xAxis = Array.isArray(chart?.xAxis) ? chart.xAxis[0] : chart?.xAxis;

    expect(xAxis?.categories).toHaveLength(1);
    expect(chart?.series).toHaveLength(7);
  });
});
