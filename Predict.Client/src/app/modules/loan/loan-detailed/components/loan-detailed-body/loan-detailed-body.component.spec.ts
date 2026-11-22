import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { describe, expect, it, vi } from 'vitest';
import { LoanStore } from 'src/app/modules/loan/stores/loan.store';
import { LoanDetailedBodyComponent } from './loan-detailed-body.component';
import { expectComponentCreation } from 'src/app/testing/component-test-setup';

describe('LoanDetailedBodyComponent', () => {
  it('creates', () => {
    expectComponentCreation(LoanDetailedBodyComponent);
  });

  it('maps chart selections to the URL and recalculates chart inputs', () => {
    expectComponentCreation(LoanDetailedBodyComponent, (fixture) => {
      const component = fixture.componentInstance;
      const store = TestBed.inject(LoanStore) as unknown as Record<
        string,
        { set: (value: unknown) => void }
      >;
      const route = TestBed.inject(ActivatedRoute) as unknown as {
        queryParamMap: {
          next: (value: ReturnType<typeof convertToParamMap>) => void;
        };
        snapshot: { queryParamMap: ReturnType<typeof convertToParamMap> };
      };
      const router = TestBed.inject(Router) as unknown as {
        navigate: ReturnType<typeof vi.fn>;
      };
      const internals = component as unknown as {
        fromQuerySelection: (value: string | null) => string | null;
        toQuerySelection: (value: string) => string;
        isChartSelection: (value: string | null) => boolean;
        persistChartSelection: (value: string) => void;
      };
      expect(component.chartBasePaymentChange()).toBe('pie-chart');
      expect(router.navigate).toHaveBeenCalledWith([], {
        relativeTo: route,
        queryParams: { chartSelection: 'pie-chart' },
        queryParamsHandling: 'merge',
        replaceUrl: true,
      });
      router.navigate.mockClear();

      route.snapshot.queryParamMap = convertToParamMap({
        chartSelection: 'pie-chart',
      });
      route.queryParamMap.next(route.snapshot.queryParamMap);
      fixture.detectChanges();

      expect(internals.fromQuerySelection('pie-chart')).toBe('pie-chart');
      expect(internals.fromQuerySelection('bar-chart')).toBe('bars-chart');
      expect(internals.fromQuerySelection('bars-chart')).toBe('bars-chart');
      expect(internals.fromQuerySelection('payments-5-years')).toBe(
        'Prd. Fixa',
      );
      expect(internals.fromQuerySelection('Prd. Fixa')).toBe('Prd. Fixa');
      expect(internals.fromQuerySelection('payments-full-term')).toBe(
        'Prd. Totala',
      );
      expect(internals.fromQuerySelection('Prd. Totala')).toBe('Prd. Totala');
      expect(internals.fromQuerySelection('rate-comparison')).toBe(
        'dot-bar-chart',
      );
      expect(internals.fromQuerySelection('dot-bar-chart')).toBe(
        'dot-bar-chart',
      );
      expect(internals.fromQuerySelection('unknown')).toBeNull();
      expect(internals.fromQuerySelection(null)).toBeNull();
      expect(internals.toQuerySelection('pie-chart')).toBe('pie-chart');
      expect(internals.toQuerySelection('bars-chart')).toBe('bar-chart');
      expect(internals.toQuerySelection('Prd. Fixa')).toBe('payments-5-years');
      expect(internals.toQuerySelection('Prd. Totala')).toBe(
        'payments-full-term',
      );
      expect(internals.toQuerySelection('dot-bar-chart')).toBe(
        'rate-comparison',
      );
      for (const valid of [
        'pie-chart',
        'bars-chart',
        'Prd. Fixa',
        'Prd. Totala',
        'dot-bar-chart',
      ]) {
        expect(internals.isChartSelection(valid)).toBe(true);
      }
      expect(internals.isChartSelection('bar-chart')).toBe(false);
      expect(internals.isChartSelection(null)).toBe(false);

      component.onChartBasePaymentChange('bars-chart');
      expect(router.navigate).toHaveBeenCalledWith(
        [],
        expect.objectContaining({
          queryParams: { chartSelection: 'bar-chart' },
        }),
      );
      router.navigate.mockClear();
      component.onChartBasePaymentChange('unknown');
      expect(router.navigate).not.toHaveBeenCalled();
      route.snapshot.queryParamMap = convertToParamMap({
        chartSelection: 'bar-chart',
      });
      internals.persistChartSelection('bars-chart');
      expect(router.navigate).not.toHaveBeenCalled();

      const rates = [
        {
          index: 1,
          paymentDate: new Date(2025, 0, 1),
          principalAmount: 100,
          interestAmount: 10,
          insuranceCost: 2,
          remainingBalance: 900,
          instalmentPayment: true,
          earlyPayment: false,
        },
        {
          index: 2,
          paymentDate: new Date(2025, 1, 1),
          principalAmount: 200,
          interestAmount: 20,
          insuranceCost: 3,
          remainingBalance: 700,
          instalmentPayment: false,
          earlyPayment: false,
        },
      ];
      const schedule = {
        name: 'Plan',
        monthlyInstalments: rates.map((rate) => ({
          ...rate,
          totalInstalment: 112,
        })),
      };
      store['historicalInstalments'].set(rates);
      store['historicalCompareInstalments'].set([rates[0]]);
      store['historicalInstalmentPaymentBatches'].set([]);
      store['simulationMonthlyInstalmentBatches'].set([
        { instalments: [{ ...rates[1], instalmentPayment: true }] },
      ]);
      store['baseRepaymentSchedule'].set(schedule);
      store['detailedSelectedSchedule'].set(schedule);
      store['detailedCompareToSchedule'].set(schedule);

      expect(component.dotBarChart().series).toHaveLength(4);
      expect(component.interestProgressPieChart()).toBeTruthy();
      expect(component.interestProgressBarChart()).toBeTruthy();
      expect(component.loanMonthlyPaymentsChart()).toBeTruthy();
      expect(component.visibleSimulationMonthlyInstalmentBatches()).toEqual([]);
      expect(component.simulatedRemainingPayments()).toEqual([]);

      component.onIncludeSimulationChanged(true);
      expect(
        (
          TestBed.inject(LoanStore) as unknown as {
            setIncludeDetailedSimulation: ReturnType<typeof vi.fn>;
          }
        ).setIncludeDetailedSimulation,
      ).toHaveBeenCalledWith(true);
      store['includeDetailedSimulation'].set(true);
      expect(component.interestProgressBarChart()).toBeTruthy();
      expect(
        component.visibleSimulationMonthlyInstalmentBatches(),
      ).toHaveLength(1);
      expect(component.simulatedRemainingPayments()).toEqual([]);

      for (const selection of [
        'bar-chart',
        'payments-5-years',
        'payments-full-term',
        'rate-comparison',
        'legacy-value',
      ]) {
        route.snapshot.queryParamMap = convertToParamMap({
          chartSelection: selection,
        });
        route.queryParamMap.next(route.snapshot.queryParamMap);
      }
      expect(component.chartBasePaymentChange()).toBe('pie-chart');
      internals.persistChartSelection('pie-chart');
      expect(router.navigate).toHaveBeenCalledWith(
        [],
        expect.objectContaining({
          queryParams: { chartSelection: 'pie-chart' },
        }),
      );
      router.navigate.mockClear();
      component.onChartBasePaymentChange('dot-bar-chart');
      expect(router.navigate).toHaveBeenCalledWith(
        [],
        expect.objectContaining({
          queryParams: { chartSelection: 'rate-comparison' },
        }),
      );
    });
  });
});
