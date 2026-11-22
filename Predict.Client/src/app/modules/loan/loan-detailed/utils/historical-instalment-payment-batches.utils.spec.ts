import { describe, expect, it } from 'vitest';
import { HistoricalInstalmentPaymentBatchesUtils } from './historical-instalment-payment-batches.utils';
import type { HistoricalInstalmentPayment } from '../models/base-loan-rate.model';

describe('HistoricalInstalmentPaymentBatchesUtils', () => {
  it('returns no batches for an empty history', () => {
    expect(
      HistoricalInstalmentPaymentBatchesUtils.getHistoricalInstalmentPaymentBatches(
        [],
      ),
    ).toEqual([]);
  });

  it('groups a normal and early payment together before unpaid entries', () => {
    const date = new Date(2024, 0, 15);
    const payments = [
      {
        index: 10,
        paymentDate: date,
        instalmentPayment: true,
        earlyPayment: false,
      },
      {
        index: 11,
        paymentDate: date,
        instalmentPayment: false,
        earlyPayment: true,
      },
      {
        index: 12,
        paymentDate: date,
        instalmentPayment: false,
        earlyPayment: false,
      },
    ] as HistoricalInstalmentPayment[];

    const batches =
      HistoricalInstalmentPaymentBatchesUtils.getHistoricalInstalmentPaymentBatches(
        payments,
      );

    expect(batches).toHaveLength(2);
    expect(batches[0].instalments.map((payment) => payment.index)).toEqual([
      1, 2,
    ]);
    expect(batches[0].completed).toBe(true);
    expect(batches[1].instalments.map((payment) => payment.index)).toEqual([3]);
    expect(batches[1].completed).toBe(false);
  });
});
