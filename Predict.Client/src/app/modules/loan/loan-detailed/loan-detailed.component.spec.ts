import { TestBed } from '@angular/core/testing';
import { LoanStore } from 'src/app/modules/loan/stores/loan.store';
import { describe, expect, it, vi } from 'vitest';
import { LoanDetailedComponent } from './loan-detailed.component';
import { expectComponentCreation } from 'src/app/testing/component-test-setup';

describe('LoanDetailedComponent', () => {
  it('should create', () => {
    expectComponentCreation(LoanDetailedComponent);
  });

  it('lists repayment schedules and forwards selection and calculation changes', () => {
    expectComponentCreation(LoanDetailedComponent, (fixture) => {
      const store = TestBed.inject(LoanStore) as unknown as {
        repaymentSchedules: { set(value: { name: string }[]): void };
        selectDetailedLoan: (name: string) => void;
        setCalculateRepaymentSchedules: (value: boolean) => void;
        loadRepaymentSchedules: () => void;
      };
      const select = vi.spyOn(store, 'selectDetailedLoan');
      const calculate = vi.spyOn(store, 'setCalculateRepaymentSchedules');
      const load = vi.spyOn(store, 'loadRepaymentSchedules');

      store.repaymentSchedules.set([{ name: 'Variable' }]);
      fixture.detectChanges();
      expect(fixture.componentInstance.dropDownSelectOptions()).toEqual([
        'Variable',
      ]);

      fixture.componentInstance.onDropdownSelected('Variable');
      fixture.componentInstance.onCalculateRepaymentSchedulesChanged(false);
      expect(select).toHaveBeenCalledWith('Variable');
      expect(calculate).toHaveBeenCalledWith(false);
      expect(load).toHaveBeenCalledOnce();
    });
  });
});
