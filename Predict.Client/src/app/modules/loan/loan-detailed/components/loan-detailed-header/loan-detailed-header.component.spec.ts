import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { LoanStore } from 'src/app/modules/loan/stores/loan.store';
import { LoanDetailedHeaderComponent } from './loan-detailed-header.component';
import { expectComponentCreation } from 'src/app/testing/component-test-setup';

describe('LoanDetailedHeaderComponent', () => {
  it('creates', () => {
    expectComponentCreation(LoanDetailedHeaderComponent);
  });

  it('calculates paid, remaining, and simulated loan summary values', () => {
    expectComponentCreation(LoanDetailedHeaderComponent, (fixture) => {
      const component = fixture.componentInstance;
      const store = TestBed.inject(LoanStore) as unknown as Record<
        string,
        { set: (value: unknown) => void }
      >;
      const date = (year: number, month: number) => new Date(year, month, 1);
      const row = (
        index: number,
        paymentDate: Date | null,
        values: Partial<Record<string, unknown>> = {},
      ) => ({
        index,
        paymentDate,
        newPaymentDate: paymentDate,
        principalAmount: 100,
        interestAmount: 10,
        insuranceCost: 2,
        totalInstalment: 112,
        remainingBalance: 1000,
        instalmentPayment: false,
        earlyPayment: false,
        ...values,
      });
      const historical = [
        row(1, date(2025, 0), { principalAmount: 100, earlyPayment: true }),
        row(2, date(2025, 1), {
          principalAmount: 200,
          interestAmount: 20,
          insuranceCost: 5,
          instalmentPayment: true,
        }),
        row(3, date(2025, 2), {
          principalAmount: 300,
          instalmentPayment: false,
          earlyPayment: false,
        }),
      ];
      const completedBatch = {
        completed: true,
        instalments: [
          { paymentDate: date(2025, 0) },
          { paymentDate: date(2025, 1) },
        ],
      };
      const pendingBatch = {
        completed: false,
        instalments: [{ paymentDate: date(2025, 2) }],
      };
      store['historicalInstalments'].set(historical);
      store['historicalInstalmentPaymentBatches'].set([
        completedBatch,
        pendingBatch,
      ]);
      store['simulationMonthlyInstalmentBatches'].set([
        {
          instalments: [
            row(10, date(2025, 0), {
              principalAmount: 30,
              earlyPayment: true,
            }),
            row(11, date(2025, 11), {
              principalAmount: 40,
              interestAmount: 4,
              insuranceCost: 2,
              instalmentPayment: true,
            }),
            row(12, date(2025, 11), {
              principalAmount: 500,
              earlyPayment: false,
              instalmentPayment: false,
            }),
          ],
        },
      ]);
      store['includeDetailedSimulation'].set(true);
      store['baseRepaymentSchedule'].set({
        monthlyInstalments: Array.from({ length: 12 }, (_, index) =>
          row(index + 1, date(2030, index)),
        ),
      });
      fixture.detectChanges();

      expect(component.paidPrincipal()).toBe(300);
      expect(component.paidPrincipalPercent()).toBe(50);
      expect(component.paidIntrest()).toBe(20);
      expect(component.paidInsurance()).toBe(5);
      expect(component.totalPaid()).toBe(325);
      expect(component.paidInstalments()).toBe(2);
      expect(component.unpaidInstalments()).toBe(3);
      expect(component.firstInstalmentPaymentDate()).toEqual(date(2025, 0));
      expect(component.lastInstalmentPaymentDate()).toEqual(date(2025, 2));
      expect(component.dateDiffYMD()).toBeTruthy();

      expect(component.simulatedPayments()).toHaveLength(2);
      expect(component.hasSimulatedPayments()).toBe(true);
      expect(component.simulatedPaidPrincipal()).toBe(370);
      expect(component.simulatedPaidPrincipalPercent()).toBeCloseTo(61.67, 2);
      expect(component.simulatedPaidInterest()).toBe(24);
      expect(component.simulatedPaidInsurance()).toBe(7);
      expect(component.simulatedTotalPaid()).toBe(401);
      expect(component.simulatedPaidInstalments()).toBe(4);
      expect(component.simulatedTotalInstalments()).toBe(12);
      expect(component.simulatedFirstInstalmentPaymentDate()).toEqual(
        date(2025, 0),
      );
      expect(component.simulatedLastInstalmentPaymentDate()).toEqual(
        date(2025, 11),
      );
      expect(component.simulatedDateDiffYMD()).toBeTruthy();
      expect(fixture.nativeElement.textContent).toContain('401');

      store['historicalInstalments'].set([
        ...historical,
        row(4, date(2025, 3), { principalAmount: null }),
      ]);
      expect(component.simulatedPaidPrincipalPercent()).toBeCloseTo(61.67, 2);

      store['historicalInstalments'].set([
        ...historical.slice(0, 2),
        row(3, date(2030, 0)),
      ]);
      expect(component.simulatedDateDiffYMD()).toBeTruthy();

      store['simulationMonthlyInstalmentBatches'].set([
        {
          instalments: [
            row(13, date(2025, 5), {
              principalAmount: null,
              interestAmount: null,
              insuranceCost: null,
              instalmentPayment: true,
            }),
          ],
        },
      ]);
      expect(component.simulatedPaidPrincipal()).toBe(300);
      expect(component.simulatedPaidInterest()).toBe(20);
      expect(component.simulatedPaidInsurance()).toBe(5);

      store['includeDetailedSimulation'].set(false);
      expect(component.hasSimulatedPayments()).toBe(false);
      store['simulationMonthlyInstalmentBatches'].set([
        {
          instalments: [
            row(13, null, { earlyPayment: true, newPaymentDate: null }),
          ],
        },
      ]);
      store['includeDetailedSimulation'].set(true);
      expect(component.simulatedLastInstalmentPaymentDate()).toBeNull();
      expect(component.simulatedDateDiffYMD()).toBeNull();

      store['historicalInstalments'].set([]);
      store['historicalInstalmentPaymentBatches'].set([]);
      store['simulationMonthlyInstalmentBatches'].set([]);
      store['baseRepaymentSchedule'].set(null);
      expect(component.paidPrincipal()).toBeNull();
      expect(Number.isNaN(component.paidPrincipalPercent())).toBe(true);
      expect(Number.isNaN(component.simulatedPaidPrincipalPercent())).toBe(
        true,
      );
      expect(component.simulatedPaidPrincipal()).toBe(0);
      expect(component.simulatedPaidInterest()).toBe(0);
      expect(component.simulatedPaidInsurance()).toBe(0);
      expect(component.simulatedTotalPaid()).toBe(0);
      expect(component.simulatedPaidInstalments()).toBe(0);
      expect(component.simulatedTotalInstalments()).toBe(0);
      expect(component.firstInstalmentPaymentDate()).toBeNull();
      expect(component.lastInstalmentPaymentDate()).toBeNull();
      expect(component.simulatedDateDiffYMD()).toBeNull();
    });
  });
});
