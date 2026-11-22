import { TestBed } from '@angular/core/testing';
import { LoanStore } from 'src/app/modules/loan/stores/loan.store';
import { describe, expect, it, vi } from 'vitest';
import { LoanSimulatorBodyTableComponent } from './loan-simulator-body-table.component';
import { expectComponentCreation } from 'src/app/testing/component-test-setup';
import {
  LoanSimulatorInstalment,
  MonthlyInstalmentManager,
} from '../../models/loan-simulator.model';

describe('LoanSimulatorBodyTableComponent', () => {
  it('should create', () => {
    expectComponentCreation(LoanSimulatorBodyTableComponent);
  });

  it('summarizes groups, forwards payment actions, and expands or collapses all rows', () => {
    expectComponentCreation(LoanSimulatorBodyTableComponent, (fixture) => {
      const makeInstalment = (
        overrides: Partial<LoanSimulatorInstalment> = {},
      ): LoanSimulatorInstalment => ({
        instalmentId: 10,
        paymentDate: null,
        newPaymentDate: null,
        interestAmount: 20,
        principalAmount: 80,
        administrationFee: 0,
        insuranceCost: 5,
        managementFee: 0,
        recalculatedInterest: null,
        totalInstalment: 105,
        remainingBalance: 500,
        instalmentPayment: true,
        earlyPayment: false,
        disabled: false,
        recalculated: false,
        ...overrides,
      });
      const group = new MonthlyInstalmentManager([
        makeInstalment({ instalmentId: 10 }),
        makeInstalment({
          instalmentId: 11,
          instalmentPayment: false,
          earlyPayment: true,
          principalAmount: 30,
          totalInstalment: null,
          remainingBalance: 470,
        }),
      ]);
      const secondGroup = new MonthlyInstalmentManager([
        makeInstalment({ instalmentId: 20, instalmentPayment: false }),
      ]);
      fixture.componentRef.setInput('monthlyInstalmentGroups', [
        group,
        secondGroup,
      ]);
      fixture.detectChanges();

      const component = fixture.componentInstance;
      const store = TestBed.inject(LoanStore) as unknown as {
        selectedEarlyPayments: { set(value: number[]): void };
        selectedInstalmentPayments: { set(value: number[]): void };
        toggleEarlyPayments: (ids: number[]) => void;
        toggleInstalmentPayments: (ids: number[]) => void;
      };
      const toggleEarly = vi.spyOn(store, 'toggleEarlyPayments');
      const toggleInstalment = vi.spyOn(store, 'toggleInstalmentPayments');

      expect(component.completedMonthlyInstalmentGroupsCount()).toBe(1);
      expect(component.getThemeIconPath('calendar')).toContain('/calendar.svg');
      expect(component.getSubtotal(group)).toEqual({
        instalmentsCount: 1,
        instalment: 105,
        earlyCount: 1,
        principal: 110,
        interest: 20,
        insurance: 5,
        total: 135,
        earlyPayment: 30,
        remaining: 470,
        count: 2,
      });
      expect(component.getSubtotal(secondGroup).instalmentsCount).toBe(0);

      component.onAddEarlyPayment(group);
      component.onDispatchInstalment(group);
      expect(toggleEarly).toHaveBeenCalledWith([12]);
      expect(toggleInstalment).toHaveBeenCalledWith([12]);
      store.selectedEarlyPayments.set([11]);
      component.onRemoveEarlyPayment(group);
      expect(toggleEarly).toHaveBeenCalledWith([11]);
      store.selectedEarlyPayments.set([]);
      store.selectedInstalmentPayments.set([10]);
      component.onRemoveEarlyPayment(group);
      expect(toggleInstalment).toHaveBeenCalledWith([10]);
      store.selectedInstalmentPayments.set([]);
      component.onRemoveEarlyPayment(group);
      expect(toggleEarly).toHaveBeenCalledTimes(2);
      expect(toggleInstalment).toHaveBeenCalledTimes(2);

      component.onExpandAll();
      expect(group.expanded()).toBe(true);
      expect(secondGroup.expanded()).toBe(true);
      component.onCollapseAll();
      expect(group.expanded()).toBe(false);
      expect(secondGroup.expanded()).toBe(false);
    });
  });

  it('recognizes mobile swipe directions, prevents defaults, and suppresses duplicate clicks', () => {
    expectComponentCreation(LoanSimulatorBodyTableComponent, (fixture) => {
      vi.useFakeTimers();
      try {
        const component = fixture.componentInstance;
        const store = TestBed.inject(LoanStore) as unknown as {
          selectedEarlyPayments: { set(value: number[]): void };
        };
        const group = new MonthlyInstalmentManager([
          {
            instalmentId: 4,
            paymentDate: null,
            newPaymentDate: null,
            interestAmount: 0,
            principalAmount: 40,
            administrationFee: 0,
            insuranceCost: 0,
            managementFee: 0,
            recalculatedInterest: null,
            totalInstalment: 40,
            remainingBalance: 60,
            instalmentPayment: true,
            earlyPayment: false,
            disabled: false,
            recalculated: false,
          },
        ]);
        fixture.componentRef.setInput('monthlyInstalmentGroups', [group]);
        fixture.detectChanges();
        const point = (clientX: number, clientY: number) => ({
          clientX,
          clientY,
        });
        const start = () =>
          component.onMobileTouchStart(
            { touches: [point(100, 100)] } as unknown as TouchEvent,
            group,
            0,
          );
        const end = (
          clientX: number,
          clientY: number,
          shouldPrevent = true,
        ) => {
          const preventDefault = vi.fn();
          component.onMobileTouchEnd({
            changedTouches: [point(clientX, clientY)],
            cancelable: true,
            preventDefault,
          } as unknown as TouchEvent);
          if (shouldPrevent) expect(preventDefault).toHaveBeenCalledOnce();
          else expect(preventDefault).not.toHaveBeenCalled();
        };

        component.onMobileTouchStart(
          { touches: [point(100, 100)] } as unknown as TouchEvent,
          group,
          1,
        );
        component.onMobileTouchMove({
          touches: [point(0, 0)],
        } as unknown as TouchEvent);
        component.onMobileTouchEnd({
          changedTouches: [point(0, 0)],
        } as unknown as TouchEvent);
        expect(component.gestureFeedback()).toBeNull();
        component.onMobileTouchStart(
          { touches: [] } as unknown as TouchEvent,
          group,
          0,
        );
        component.onMobileTouchStart(
          { touches: [point(100, 100)] } as unknown as TouchEvent,
          group,
          0,
        );
        component.onMobileTouchEnd({
          changedTouches: [],
        } as unknown as TouchEvent);
        start();
        fixture.componentRef.setInput('monthlyInstalmentGroups', []);
        component.onMobileTouchEnd({
          changedTouches: [point(30, 100)],
        } as unknown as TouchEvent);
        fixture.componentRef.setInput('monthlyInstalmentGroups', [group]);
        fixture.detectChanges();

        start();
        component.onMobileTouchMove({ touches: [] } as unknown as TouchEvent);
        const preventMove = vi.fn();
        component.onMobileTouchMove({
          touches: [point(60, 100)],
          cancelable: true,
          preventDefault: preventMove,
        } as unknown as TouchEvent);
        expect(preventMove).toHaveBeenCalledOnce();
        expect(component.gestureFeedback()?.direction).toBe('left');
        store.selectedEarlyPayments.set([4]);
        end(30, 100);
        expect(component.gestureFeedback()?.label).toContain('Elimină');
        const expanded = group.expanded();
        component.toggleGroup(group);
        expect(group.expanded()).toBe(expanded);

        start();
        component.onMobileTouchMove({
          touches: [point(140, 100)],
        } as unknown as TouchEvent);
        component.onMobileTouchEnd({
          changedTouches: [point(170, 100)],
          cancelable: false,
          preventDefault: vi.fn(),
        } as unknown as TouchEvent);
        expect(component.gestureFeedback()?.direction).toBe('right');

        start();
        component.onMobileTouchMove({
          touches: [point(100, 140)],
        } as unknown as TouchEvent);
        end(100, 170);
        expect(component.gestureFeedback()?.direction).toBe('down');

        start();
        component.onMobileTouchMove({
          touches: [point(100, 60)],
        } as unknown as TouchEvent);
        end(100, 30);
        expect(component.gestureFeedback()?.label).toBe('Gest anulat');

        start();
        end(90, 100, false);
        expect(component.gestureFeedback()).toBeNull();
        component.onMobileTouchCancel();
        expect(component.gestureFeedback()).toBeNull();
        start();
        end(30, 100);
        expect(component.gestureFeedback()).not.toBeNull();
        vi.advanceTimersByTime(650);
        expect(component.gestureFeedback()).toBeNull();
        vi.advanceTimersByTime(1000);
        component.toggleGroup(group);
        expect(group.expanded()).toBe(true);
      } finally {
        vi.useRealTimers();
      }
    });
  });
});
