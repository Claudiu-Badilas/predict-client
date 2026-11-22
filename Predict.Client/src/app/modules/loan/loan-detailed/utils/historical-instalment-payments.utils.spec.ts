import { describe, expect, it } from 'vitest';
import type { RepaymentSchedule } from '../../models/loan.model';
import { HistoricalInstalmentPaymentsUtils } from './historical-instalment-payments.utils';

describe('HistoricalInstalmentPaymentsUtils', () => {
  it('returns no entries when the base schedule or schedule history is empty', () => {
    expect(
      HistoricalInstalmentPaymentsUtils.getHistoricalInstalmentPayments(
        null as unknown as RepaymentSchedule,
        [],
      ),
    ).toEqual([]);
  });

  it('marks paid entries from earlier schedules and unpaid entries from the latest', () => {
    const firstInstalment = {
      instalmentId: 1,
      paymentDate: new Date(2024, 0, 15),
      principalAmount: 90,
      interestAmount: 10,
      insuranceCost: 0,
      totalInstalment: 100,
      remainingBalance: 910,
    };
    const finalInstalment = {
      ...firstInstalment,
      instalmentId: 2,
      paymentDate: new Date(2024, 1, 15),
      remainingBalance: 820,
    };
    const base = {
      monthlyInstalments: [firstInstalment, finalInstalment],
    } as unknown as RepaymentSchedule;
    const schedules = [
      {
        date: new Date(2024, 0, 1),
        monthlyInstalments: [firstInstalment, finalInstalment],
      },
      {
        date: new Date(2024, 1, 1),
        isNormalPayment: true,
        isExtraPayment: false,
        monthlyInstalments: [finalInstalment],
      },
    ] as unknown as RepaymentSchedule[];

    const result =
      HistoricalInstalmentPaymentsUtils.getHistoricalInstalmentPayments(
        base,
        schedules,
      );

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      paymentDate: new Date(2024, 1, 1),
      instalmentPayment: true,
      earlyPayment: false,
    });
    expect(result[1]).toMatchObject({
      paymentDate: finalInstalment.paymentDate,
      instalmentPayment: false,
      earlyPayment: false,
    });
  });
});
