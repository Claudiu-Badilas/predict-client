import { TestBed } from '@angular/core/testing';
import { LoanStore } from 'src/app/modules/loan/stores/loan.store';
import { describe, expect, it, vi } from 'vitest';
import { LoanSimulatorComponent } from './loan-simulator.component';
import { expectComponentCreation } from 'src/app/testing/component-test-setup';

describe('LoanSimulatorComponent', () => {
  it('should create', () => {
    expectComponentCreation(LoanSimulatorComponent);
  });

  it('exposes schedules and forwards selections and calculation changes', () => {
    expectComponentCreation(LoanSimulatorComponent, (fixture) => {
      const store = TestBed.inject(LoanStore) as unknown as {
        repaymentSchedules: { set(value: { name: string }[]): void };
        selectOverviewLoan: (name: string) => void;
        setCalculateRepaymentSchedules: (value: boolean) => void;
        loadRepaymentSchedules: () => void;
      };
      const select = vi.spyOn(store, 'selectOverviewLoan');
      const calculate = vi.spyOn(store, 'setCalculateRepaymentSchedules');
      const load = vi.spyOn(store, 'loadRepaymentSchedules');

      store.repaymentSchedules.set([
        { name: 'Standard' },
        { name: 'Accelerated' },
      ]);
      fixture.detectChanges();
      expect(fixture.componentInstance.dropDownSelectOptions()).toEqual([
        'Standard',
        'Accelerated',
      ]);

      fixture.componentInstance.onDropdownSelected('Accelerated');
      fixture.componentInstance.onCalculateRepaymentSchedulesChanged(true);
      expect(select).toHaveBeenCalledWith('Accelerated');
      expect(calculate).toHaveBeenCalledWith(true);
      expect(load).toHaveBeenCalledOnce();
    });
  });
});
