import { describe, expect, it } from 'vitest';
import type { RepaymentSchedule } from '../../models/loan.model';
import { generateMonthlyInstalmentBatches } from './monthly-instalment-batches.utils';

describe('generateMonthlyInstalmentBatches', () => {
  it('returns no batches when no base schedule is selected', () => {
    expect(generateMonthlyInstalmentBatches(null, [], [])).toEqual([]);
  });

  it('wraps a selected instalment in a completed payment batch', () => {
    const paymentDate = new Date(2024, 0, 15);
    const schedule = {
      monthlyInstalments: [
        {
          instalmentId: 1,
          paymentDate,
          interestAmount: 10,
          principalAmount: 90,
          administrationFee: 0,
          insuranceCost: 0,
          managementFee: 0,
          recalculatedInterest: 10,
          totalInstalment: 100,
          remainingBalance: 910,
          recalculated: false,
        },
      ],
    } as unknown as RepaymentSchedule;

    const batches = generateMonthlyInstalmentBatches(schedule, [1], []);

    expect(batches).toHaveLength(1);
    expect(batches[0].completed).toBe(true);
    expect(batches[0].id).toBe(1);
    expect(batches[0].title).toEqual(paymentDate);
    expect(batches[0].instalments[0].batchTotalInstalment).toBe(100);
  });
});
