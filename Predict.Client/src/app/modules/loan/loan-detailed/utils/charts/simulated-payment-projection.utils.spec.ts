import { describe, expect, it } from 'vitest';
import { SimulatedPaymentProjectionUtils } from './simulated-payment-projection.utils';
import type { HistoricalInstalmentPayment } from '../../models/base-loan-rate.model';

describe('SimulatedPaymentProjectionUtils', () => {
  it('returns no future projection when every payment is already paid', () => {
    const paidHistory = [
      {
        index: 1,
        paymentDate: new Date(2024, 0, 15),
        principalAmount: 100,
        interestAmount: 10,
        insuranceCost: 0,
        remainingBalance: 0,
        instalmentPayment: true,
        earlyPayment: false,
      },
    ] as HistoricalInstalmentPayment[];

    expect(
      SimulatedPaymentProjectionUtils.getRemainingPayments(paidHistory, []),
    ).toEqual([]);
  });

  it('projects a scheduled payment from the first unpaid entry', () => {
    const paymentDate = new Date(2024, 1, 15);
    const unpaidHistory = [
      {
        index: 2,
        paymentDate,
        principalAmount: 100,
        interestAmount: 10,
        insuranceCost: 0,
        totalInstalment: 110,
        remainingBalance: 0,
        instalmentPayment: false,
        earlyPayment: false,
      },
    ] as HistoricalInstalmentPayment[];

    expect(
      SimulatedPaymentProjectionUtils.getRemainingPayments(unpaidHistory, [
        { monthlyAmount: 200, payments: 1 },
      ]),
    ).toEqual([
      {
        paymentDate,
        normalPaymentAmount: 110,
        extraPaymentAmount: 0,
      },
    ]);
  });
});
