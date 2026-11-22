import { signal, WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';
import { LoanStore } from '../../stores/loan.store';
import {
  SimulationCombination,
  SimulationCombinationsStore,
} from './simulation-combinations.store';
import { SimulationCombinationsComponent } from './simulation-combinations.component';
import { expectComponentCreation } from 'src/app/testing/component-test-setup';

describe('SimulationCombinationsComponent', () => {
  it('creates', () => {
    expectComponentCreation(SimulationCombinationsComponent);
  });

  it('keeps combination forms synchronized and validates copied payment ranges', () => {
    const source: SimulationCombination = {
      id: 'source',
      monthlyAmount: 500,
      payments: 4,
    };
    const storeMock = {
      rows: signal([source]),
      setRows: vi.fn(),
    };
    expectComponentCreation(
      SimulationCombinationsComponent,
      (fixture) => {
        const component = fixture.componentInstance;
        const store = TestBed.inject(
          SimulationCombinationsStore,
        ) as unknown as {
          rows: WritableSignal<SimulationCombination[]>;
          setRows: ReturnType<typeof vi.fn>;
        };
        const loanStore = TestBed.inject(LoanStore) as unknown as {
          resetSimulationPaymentOverrides: ReturnType<typeof vi.fn>;
        };
        expect(component.rows.length).toBe(1);
        expect(
          fixture.nativeElement.querySelectorAll('.combination-card'),
        ).toHaveLength(1);
        expect(
          fixture.nativeElement.querySelector('.btn-delete').disabled,
        ).toBe(true);

        fixture.componentRef.setInput('maxPayments', 5);
        fixture.detectChanges();
        expect(component.rows.at(0).controls.payments.errors).toBeNull();
        component.addRow('missing');
        expect(component.rows.length).toBe(1);
        component.addRow('source');
        fixture.detectChanges();
        expect(component.rows.length).toBe(2);
        expect(component.rows.at(1).getRawValue()).toMatchObject({
          monthlyAmount: 500,
          payments: 4,
        });

        component.rows.at(0).controls.payments.setValue(null);
        expect(
          component.rows.at(0).controls.payments.hasError('required'),
        ).toBe(true);
        component.rows.at(1).controls.payments.setValue(null);
        expect(
          component.rows.at(1).controls.payments.hasError('required'),
        ).toBe(false);
        component.rows.at(0).controls.payments.setValue(6);
        expect(component.rows.at(0).controls.payments.hasError('max')).toBe(
          true,
        );
        component.rows.at(0).controls.payments.setValue(0);
        expect(component.rows.at(0).controls.payments.hasError('min')).toBe(
          true,
        );
        component.rows.at(0).controls.payments.setValue(4);
        expect(store.setRows).toHaveBeenCalled();
        expect(loanStore.resetSimulationPaymentOverrides).toHaveBeenCalled();

        const generatedId = component.rows.at(1).controls.id.value;
        store.rows.set(component.rows.getRawValue());
        component.removeRow('missing');
        expect(component.rows.length).toBe(2);
        component.removeRow(generatedId);
        expect(component.rows.length).toBe(1);
        store.rows.set(component.rows.getRawValue());
        component.removeRow('source');
        expect(component.rows.length).toBe(1);

        component.rows.at(0).controls.monthlyAmount.setValue(null);
        component.addRow('source');
        expect(component.form.invalid).toBe(true);
        expect(component.rows.at(0).controls.monthlyAmount.touched).toBe(true);
        component.rows.at(0).controls.monthlyAmount.setValue(500);

        fixture.componentRef.setInput('maxPayments', undefined);
        fixture.detectChanges();
        component.rows.at(0).controls.payments.setValue(8);
        expect(component.rows.at(0).controls.payments.hasError('max')).toBe(
          false,
        );

        fixture.componentRef.setInput('showCombinations', false);
        fixture.detectChanges();
        expect(
          fixture.nativeElement.querySelector('.simulation-rows'),
        ).toBeNull();
      },
      [
        {
          provide: SimulationCombinationsStore,
          useValue: storeMock,
        },
      ],
    );
  });
});
