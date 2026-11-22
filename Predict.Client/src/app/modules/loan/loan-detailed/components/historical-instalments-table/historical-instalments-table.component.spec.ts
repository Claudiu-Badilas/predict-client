import { describe, expect, it } from 'vitest';
import { HistoricalInstalmentsTableComponent } from './historical-instalments-table.component';
import { expectComponentCreation } from 'src/app/testing/component-test-setup';
import {
  HistoricalInstalmentPayment,
  HistoricalInstalmentPaymentBatch,
} from '../../models/base-loan-rate.model';
import {
  LoanSimulatorInstalment,
  MonthlyInstalmentManager,
} from '../../../loan-simulator/models/loan-simulator.model';

describe('HistoricalInstalmentsTableComponent', () => {
  it('should create', () => {
    expectComponentCreation(HistoricalInstalmentsTableComponent);
  });

  it('combines historical and simulated payment summaries in date order', () => {
    expectComponentCreation(HistoricalInstalmentsTableComponent, (fixture) => {
      const row = (
        index: number,
        overrides: Partial<HistoricalInstalmentPayment> = {},
      ): HistoricalInstalmentPayment => ({
        index,
        paymentDate: new Date(2024, 0, index),
        principalAmount: 100,
        interestAmount: 20,
        insuranceCost: 5,
        totalInstalment: 125,
        remainingBalance: 500,
        instalmentPayment: false,
        earlyPayment: false,
        ...overrides,
      });
      const historical = [
        new HistoricalInstalmentPaymentBatch([
          row(1, { instalmentPayment: true }),
          row(2, {
            earlyPayment: true,
            principalAmount: 30,
            remainingBalance: 470,
          }),
        ]),
        new HistoricalInstalmentPaymentBatch([
          row(3, {
            earlyPayment: true,
            principalAmount: 25,
            remainingBalance: 0,
          }),
        ]),
        new HistoricalInstalmentPaymentBatch([row(4)]),
      ];
      const simulatedRow = (
        overrides: Partial<LoanSimulatorInstalment> = {},
      ): LoanSimulatorInstalment => ({
        instalmentId: 10,
        paymentDate: null,
        newPaymentDate: null,
        interestAmount: 12,
        principalAmount: 80,
        administrationFee: 0,
        insuranceCost: 3,
        managementFee: 0,
        recalculatedInterest: null,
        totalInstalment: 95,
        remainingBalance: 400,
        instalmentPayment: false,
        earlyPayment: false,
        disabled: false,
        recalculated: false,
        ...overrides,
      });
      const simulation = new MonthlyInstalmentManager([
        simulatedRow({ instalmentPayment: true }),
        simulatedRow({
          instalmentId: 11,
          earlyPayment: true,
          principalAmount: null,
          remainingBalance: 0,
        }),
      ]);
      simulation.title = new Date(2024, 1, 1);
      const stringSimulation = new MonthlyInstalmentManager([
        simulatedRow({ instalmentPayment: true }),
      ]);
      (stringSimulation as unknown as { title: string }).title = '2024-01-02';
      const futureStringSimulation = new MonthlyInstalmentManager([
        simulatedRow({ instalmentPayment: true }),
      ]);
      (futureStringSimulation as unknown as { title: string }).title =
        '2026-01-02';
      const emptySimulation = new MonthlyInstalmentManager([
        simulatedRow({ instalmentPayment: false, earlyPayment: false }),
      ]);
      emptySimulation.title = new Date(2025, 0, 1);
      fixture.componentRef.setInput('monthlyInstalmentGroups', historical);
      fixture.componentRef.setInput('simulationInstalmentGroups', [
        simulation,
        stringSimulation,
        futureStringSimulation,
        emptySimulation,
      ]);
      fixture.detectChanges();

      const groups = fixture.componentInstance.monthlyGroups();
      expect(groups).toHaveLength(5);
      expect(groups.map((group) => group.title)).toEqual([
        '2026-01-02',
        new Date(2024, 1, 1),
        new Date(2024, 0, 3),
        '2024-01-02',
        new Date(2024, 0, 1),
      ]);
      expect(groups[1].isSimulation).toBe(true);
      expect(groups[1].subtotal).toMatchObject({
        instalmentsCount: 1,
        earlyCount: 1,
        principal: 80,
        interest: 12,
        insuranceCost: 3,
        total: 95,
        remainingBalance: 0,
      });
      expect(groups[2].subtotal).toMatchObject({
        instalmentsCount: 0,
        earlyCount: 1,
        principal: 25,
        interest: 0,
        insuranceCost: 0,
        total: 25,
        remainingBalance: 0,
      });
      expect(groups[3].isSimulation).toBe(true);
      expect(groups[4].subtotal).toMatchObject({
        instalmentsCount: 1,
        earlyCount: 1,
        principal: 130,
        interest: 20,
        insuranceCost: 5,
        total: 155,
        remainingBalance: 470,
      });
    });
  });
});
