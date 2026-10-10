import { computed } from '@angular/core';
import {
  signalStore,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';
import { patchState } from '@ngrx/signals';
import { LoanSimulatorRepaymentSchedule } from '../loan-simulator/models/loan-simulator.model';
import { generateMonthlyInstalmentBatches } from '../loan-simulator/utils/monthly-instalment-batches.utils';
import { HistoricalInstalmentPaymentBatchesUtils } from '../loan-detailed/utils/historical-instalment-payment-batches.utils';
import { HistoricalInstalmentPaymentsUtils } from '../loan-detailed/utils/historical-instalment-payments.utils';
import { JsDateUtils } from 'src/app/shared/utils/js-date.utils';
import { RepaymentSchedule } from '../models/loan.model';

interface OverviewLoanState {
  repaymentSchedules: LoanSimulatorRepaymentSchedule[];
  selectedRepaymentScheduleName: string | null;
  selectedInstalmentPayments: number[];
  selectedEarlyPayments: number[];
}

interface DetailedLoanState {
  selectedRepaymentScheduleName: string | null;
}

export interface LoanState {
  calculateRepaymentSchedules: boolean;
  repaymentSchedules: RepaymentSchedule[];
  overview: OverviewLoanState;
  detailed: DetailedLoanState;
}

const initialState: LoanState = {
  calculateRepaymentSchedules: false,
  repaymentSchedules: [],
  overview: {
    repaymentSchedules: [],
    selectedRepaymentScheduleName: null,
    selectedInstalmentPayments: [],
    selectedEarlyPayments: [],
  },
  detailed: { selectedRepaymentScheduleName: null },
};

export const LoanStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed((state) => {
    const baseRepaymentSchedule = computed(
      () =>
        state.repaymentSchedules().find((schedule) => schedule.isBasePayment) ??
        null,
    );
    const overviewSelectedName = computed(
      () =>
        state.overview.selectedRepaymentScheduleName() ??
        state.repaymentSchedules()[0]?.name ??
        null,
    );
    const selectedOverviewSchedule = computed(
      () =>
        state
          .repaymentSchedules()
          .find((schedule) => schedule.name === overviewSelectedName()) ?? null,
    );
    const selectedInstalmentPayments = computed(() =>
      state.overview.selectedInstalmentPayments().length > 0
        ? state.overview.selectedInstalmentPayments()
        : [1],
    );
    const selectedEarlyPayments = computed(() =>
      state.overview.selectedEarlyPayments(),
    );
    const detailedSelectedName = computed(
      () =>
        state.detailed.selectedRepaymentScheduleName() ||
        state.repaymentSchedules()[0]?.name,
    );
    const detailedSelectedSchedule = computed(() =>
      state
        .repaymentSchedules()
        .find((schedule) => schedule.name === detailedSelectedName()),
    );
    const detailedCompareToSchedule = computed(() => {
      const date = JsDateUtils.addMonths(detailedSelectedSchedule()?.date, -1);
      const targetDate = new Date(
        `01-${date.getMonth() + 1}-${date.getFullYear()}`,
      );
      const foundTarget = state
        .repaymentSchedules()
        .filter((schedule) => schedule.isExtraPayment)
        .find((schedule) => {
          const scheduleDate = new Date(
            `01-${schedule.date.getMonth() + 1}-${schedule.date.getFullYear()}`,
          );
          return JsDateUtils.isSame(scheduleDate, targetDate);
        });
      return foundTarget || baseRepaymentSchedule();
    });
    const detailedRepaymentSchedules = computed(() =>
      state
        .repaymentSchedules()
        .filter(
          (schedule) =>
            !detailedSelectedSchedule() ||
            JsDateUtils.isSameOrBefore(
              schedule.date,
              detailedSelectedSchedule()!.date,
            ),
        ),
    );
    const detailedCompareSchedules = computed(() =>
      state
        .repaymentSchedules()
        .filter(
          (schedule) =>
            !detailedCompareToSchedule() ||
            JsDateUtils.isSameOrBefore(
              schedule.date,
              detailedCompareToSchedule()!.date,
            ),
        ),
    );
    const historicalInstalments = computed(() =>
      HistoricalInstalmentPaymentsUtils.getHistoricalInstalmentPayments(
        baseRepaymentSchedule(),
        detailedRepaymentSchedules(),
      ),
    );
    const historicalCompareInstalments = computed(() =>
      HistoricalInstalmentPaymentsUtils.getHistoricalInstalmentPayments(
        baseRepaymentSchedule(),
        detailedCompareSchedules(),
      ),
    );

    return {
      baseRepaymentSchedule,
      latestRepaymentSchedule: computed(() =>
        state.repaymentSchedules().length
          ? [...state.repaymentSchedules()].sort(
              (left, right) => right.date.valueOf() - left.date.valueOf(),
            )[0]
          : null,
      ),
      overviewSelectedName,
      selectedOverviewSchedule,
      selectedInstalmentPayments,
      selectedEarlyPayments,
      monthlyInstalmentBatches: computed(() =>
        generateMonthlyInstalmentBatches(
          selectedOverviewSchedule(),
          selectedInstalmentPayments(),
          selectedEarlyPayments(),
        ),
      ),
      detailedSelectedName,
      detailedSelectedSchedule,
      detailedCompareToSchedule,
      detailedRepaymentSchedules,
      detailedCompareSchedules,
      historicalInstalments,
      historicalCompareInstalments,
      historicalInstalmentPaymentBatches: computed(() =>
        HistoricalInstalmentPaymentBatchesUtils.getHistoricalInstalmentPaymentBatches(
          historicalInstalments(),
        ),
      ),
    };
  }),
  withMethods((state) => ({
    setCalculateRepaymentSchedules(calculateRepaymentSchedules: boolean): void {
      patchState(state, { calculateRepaymentSchedules });
    },
    setRepaymentSchedules(repaymentSchedules: RepaymentSchedule[]): void {
      patchState(state, { repaymentSchedules });
    },
    selectOverviewLoan(selectedRepaymentScheduleName: string): void {
      patchState(state, (current) => ({
        overview: {
          ...current.overview,
          selectedRepaymentScheduleName,
        },
      }));
    },
    selectDetailedLoan(selectedRepaymentScheduleName: string): void {
      patchState(state, (current) => ({
        detailed: { ...current.detailed, selectedRepaymentScheduleName },
      }));
    },
    toggleInstalmentPayments(values: number[]): void {
      patchState(state, (current) => {
        const selected = [...current.overview.selectedInstalmentPayments];
        for (const value of values) {
          const index = selected.indexOf(value);
          if (index < 0) selected.push(value);
          else selected.splice(index, 1);
        }
        return {
          overview: {
            ...current.overview,
            selectedInstalmentPayments: selected,
          },
        };
      });
    },
    toggleEarlyPayments(values: number[]): void {
      patchState(state, (current) => {
        const selected = [...current.overview.selectedEarlyPayments];
        for (const value of values) {
          const index = selected.indexOf(value);
          if (index < 0) selected.push(value);
          else selected.splice(index, 1);
        }
        return {
          overview: { ...current.overview, selectedEarlyPayments: selected },
        };
      });
    },
    setSimulationPayments(
      selectedInstalmentPayments: number[],
      selectedEarlyPayments: number[],
    ): void {
      patchState(state, (current) => ({
        overview: {
          ...current.overview,
          selectedInstalmentPayments: [...selectedInstalmentPayments],
          selectedEarlyPayments: [...selectedEarlyPayments],
        },
      }));
    },
  })),
);
