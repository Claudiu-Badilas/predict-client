import { describe, expect, it } from 'vitest';
import type { RepaymentSchedule } from '../../models/loan.model';
import {
  mapInstalmentSimulation,
  mapInstalmentSimulations,
} from './instalment-simulation.utils';

function createSchedule(): RepaymentSchedule {
  return {
    monthlyInstalments: [1, 2, 3].map((instalmentId) => ({
      instalmentId,
      principalAmount: 100,
      totalInstalment: 110,
    })),
  } as unknown as RepaymentSchedule;
}

describe('instalment simulation utilities', () => {
  it('returns no selections without a usable base or monthly amount', () => {
    expect(mapInstalmentSimulation(null, 0, { monthlyAmount: 300 })).toEqual([
      [],
      [],
    ]);
    expect(
      mapInstalmentSimulation(createSchedule(), 0, { monthlyAmount: 0 }),
    ).toEqual([[], []]);
  });

  it('splits normal instalments from early payments', () => {
    expect(
      mapInstalmentSimulation(createSchedule(), 0, { monthlyAmount: 110 }),
    ).toEqual([[1, 3], [2]]);
  });

  it('maps multiple simulation rows into combined payment selections', () => {
    expect(
      mapInstalmentSimulations(createSchedule(), [
        { monthlyAmount: 110, payments: 1 },
        { monthlyAmount: 110, payments: 1 },
      ]),
    ).toEqual([[1, 3], [2]]);
  });
});
