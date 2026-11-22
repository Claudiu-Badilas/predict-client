import { describe, expect, it, vi } from 'vitest';
import { LoanSimulatorHeaderComponent } from './loan-simulator-header.component';
import { expectComponentCreation } from 'src/app/testing/component-test-setup';
import {
  LoanSimulatorInstalment,
  MonthlyInstalmentManager,
} from '../../models/loan-simulator.model';

describe('LoanSimulatorHeaderComponent', () => {
  it('should create', () => {
    expectComponentCreation(LoanSimulatorHeaderComponent);
  });

  it('summarizes completed and early payments and calculates the next payment window', () => {
    expectComponentCreation(LoanSimulatorHeaderComponent, (fixture) => {
      const instalment = (
        overrides: Partial<LoanSimulatorInstalment>,
      ): LoanSimulatorInstalment => ({
        instalmentId: 1,
        paymentDate: null,
        newPaymentDate: null,
        interestAmount: null,
        principalAmount: null,
        administrationFee: null,
        insuranceCost: null,
        managementFee: null,
        recalculatedInterest: null,
        totalInstalment: null,
        remainingBalance: null,
        instalmentPayment: false,
        earlyPayment: false,
        disabled: false,
        recalculated: false,
        ...overrides,
      });
      const completed = new MonthlyInstalmentManager([
        instalment({
          instalmentId: 1,
          instalmentPayment: true,
          totalInstalment: 100,
          interestAmount: 20,
          insuranceCost: 5,
          principalAmount: 75,
          remainingBalance: 500,
        }),
        instalment({
          instalmentId: 2,
          earlyPayment: true,
          principalAmount: 30,
        }),
      ]);
      const incomplete = Array.from(
        { length: 11 },
        (_, index) =>
          new MonthlyInstalmentManager([
            instalment({ instalmentId: index + 3 }),
          ]),
      );
      fixture.componentRef.setInput('monthlyInstalmentGroups', [
        completed,
        ...incomplete,
      ]);
      fixture.detectChanges();

      const component = fixture.componentInstance;
      expect(component.completedPayments()).toEqual([completed]);
      expect(component.incompletedPayments()).toEqual(incomplete);
      expect(component.simulatedPeriod()).toBe('1y 0m');
      expect(component.payments()).toHaveLength(2);
      expect(component.instalmentPayments()).toEqual([
        completed.instalments[0],
      ]);
      expect(component.totalInstalmentPayments()).toBe(100);
      expect(component.totalInterestPayment()).toBe(25);
      expect(component.totalPrincipalPayment()).toBe(105);
      expect(component.earlyPayments()).toEqual([completed.instalments[1]]);
      expect(component.lastEarlyPayment()).toEqual(completed.instalments[1]);
      expect(component.totalEarlyPayment()).toBe(30);
      expect(component.paidMonthlyInstalments()).toBe(2);
      expect(component.monthlyInstalments()).toBe(13);
      expect(component.totalPayment()).toBe(130);
      expect(component.initialRemainingBalance()).toBe(575);

      vi.useFakeTimers();
      try {
        vi.setSystemTime(new Date(2024, 0, 1));
        expect(component.nextPayment).toBeTruthy();
        vi.setSystemTime(new Date(2024, 1, 20));
        expect(component.nextPayment).toBeTruthy();
      } finally {
        vi.useRealTimers();
      }
    });
  });
});
