import { DestroyRef, computed, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import {
  signalStore,
  withComputed,
  withHooks,
  withMethods,
  withState,
} from '@ngrx/signals';
import { patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import {
  EMPTY,
  catchError,
  exhaustMap,
  filter,
  finalize,
  pipe,
  tap,
} from 'rxjs';
import { LocalStorageService } from 'src/app/core/services/local-storage.service';
import { ToastStore } from 'src/app/core/toast-notifications/toast.store';
import { ToastType } from 'src/app/core/toast-notifications/models/toast-type.model';
import { LayoutStore } from 'src/app/store/layout.store';
import { LoanSimulatorRepaymentSchedule } from '../loan-simulator/models/loan-simulator.model';
import { generateMonthlyInstalmentBatches } from '../loan-simulator/utils/monthly-instalment-batches.utils';
import { HistoricalInstalmentPaymentBatchesUtils } from '../loan-detailed/utils/historical-instalment-payment-batches.utils';
import { HistoricalInstalmentPaymentsUtils } from '../loan-detailed/utils/historical-instalment-payments.utils';
import { JsDateUtils } from 'src/app/shared/utils/js-date.utils';
import { RepaymentSchedule } from '../models/loan.model';
import { LoanEncryptionKeyBase64, LoanService } from '../services/loan.service';
import { SimulationCombinationsStore } from '../components/simulation-combinations/simulation-combinations.store';
import { mapInstalmentSimulations } from '../loan-simulator/utils/instalment-simulation.utils';

interface OverviewLoanState {
  repaymentSchedules: LoanSimulatorRepaymentSchedule[];
  selectedRepaymentScheduleName: string | null;
  selectedInstalmentPayments: number[] | null;
  selectedEarlyPayments: number[] | null;
}

interface DetailedLoanState {
  selectedRepaymentScheduleName: string | null;
  includeSimulation: boolean;
}

export interface LoanState {
  calculateRepaymentSchedules: boolean;
  repaymentSchedules: RepaymentSchedule[];
  loading: boolean;
  error: string | null;
  overview: OverviewLoanState;
  detailed: DetailedLoanState;
}

const initialState: LoanState = {
  calculateRepaymentSchedules: false,
  repaymentSchedules: [],
  loading: false,
  error: null,
  overview: {
    repaymentSchedules: [],
    selectedRepaymentScheduleName: null,
    selectedInstalmentPayments: null,
    selectedEarlyPayments: null,
  },
  detailed: {
    selectedRepaymentScheduleName: null,
    includeSimulation: false,
  },
};

export const LoanStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed((state) => {
    const combinationsStore = inject(SimulationCombinationsStore);
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
    const simulatedPayments = computed(() =>
      mapInstalmentSimulations(
        selectedOverviewSchedule(),
        combinationsStore.rows(),
      ),
    );
    const selectedInstalmentPayments = computed(
      () =>
        state.overview.selectedInstalmentPayments() ??
        (simulatedPayments()[0].length > 0 ? simulatedPayments()[0] : [1]),
    );
    const selectedEarlyPayments = computed(
      () => state.overview.selectedEarlyPayments() ?? simulatedPayments()[1],
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
      simulationMonthlyInstalmentBatches: computed(() =>
        generateMonthlyInstalmentBatches(
          selectedOverviewSchedule(),
          simulatedPayments()[0],
          simulatedPayments()[1],
        ),
      ),
      monthlyInstalmentBatches: computed(() =>
        generateMonthlyInstalmentBatches(
          selectedOverviewSchedule(),
          selectedInstalmentPayments(),
          selectedEarlyPayments(),
        ),
      ),
      detailedSelectedName,
      includeDetailedSimulation: computed(() =>
        state.detailed.includeSimulation(),
      ),
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
  withMethods(
    (
      state,
      loanService = inject(LoanService),
      layoutStore = inject(LayoutStore),
      toastStore = inject(ToastStore),
    ) => {
      const combinationsStore = inject(SimulationCombinationsStore);
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
            .find((schedule) => schedule.name === overviewSelectedName()) ??
          null,
      );
      const simulatedPayments = computed(() =>
        mapInstalmentSimulations(
          selectedOverviewSchedule(),
          combinationsStore.rows(),
        ),
      );
      const loadSchedules = rxMethod<void>(
        pipe(
          exhaustMap(() => {
            patchState(state, { loading: true, error: null });
            layoutStore.beginOperation();

            return loanService.getRepaymentSchedules().pipe(
              tap((loans) => {
                const base = loans.find((loan) => loan.isBasePayment);
                const variableInterestStartDate =
                  base?.monthlyInstalments[5 * 12 - 1]?.paymentDate;
                const repaymentSchedules = loans.map((schedule) => {
                  if (
                    state.calculateRepaymentSchedules() &&
                    variableInterestStartDate
                  ) {
                    schedule.recalculateFixedRate(variableInterestStartDate);
                  }
                  return schedule;
                });
                patchState(state, { repaymentSchedules });
              }),
              catchError((error: unknown) => {
                const message =
                  error instanceof Error
                    ? error.message
                    : 'Failed to load repayment schedules.';
                patchState(state, { error: message });
                toastStore.show(
                  'Something went wrong. Please try again.',
                  ToastType.Error,
                );
                return EMPTY;
              }),
              finalize(() => {
                patchState(state, { loading: false });
                layoutStore.endOperation();
              }),
            );
          }),
        ),
      );

      return {
        loadRepaymentSchedules(): void {
          loadSchedules(undefined);
        },
        setCalculateRepaymentSchedules(
          calculateRepaymentSchedules: boolean,
        ): void {
          patchState(state, { calculateRepaymentSchedules });
        },
        selectOverviewLoan(selectedRepaymentScheduleName: string): void {
          patchState(state, (current) => ({
            overview: {
              ...current.overview,
              selectedRepaymentScheduleName,
              selectedInstalmentPayments: null as number[] | null,
              selectedEarlyPayments: null as number[] | null,
            },
          }));
        },
        selectDetailedLoan(selectedRepaymentScheduleName: string): void {
          patchState(state, (current) => ({
            detailed: { ...current.detailed, selectedRepaymentScheduleName },
          }));
        },
        setIncludeDetailedSimulation(includeSimulation: boolean): void {
          patchState(state, (current) => ({
            detailed: { ...current.detailed, includeSimulation },
          }));
        },
        toggleInstalmentPayments(values: number[]): void {
          patchState(state, (current) => {
            const initialSelection = simulatedPayments()[0];
            const selected = [
              ...(current.overview.selectedInstalmentPayments ??
                (initialSelection.length > 0 ? initialSelection : [1])),
            ];
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
            const selected = [
              ...(current.overview.selectedEarlyPayments ??
                simulatedPayments()[1]),
            ];
            for (const value of values) {
              const index = selected.indexOf(value);
              if (index < 0) selected.push(value);
              else selected.splice(index, 1);
            }
            return {
              overview: {
                ...current.overview,
                selectedEarlyPayments: selected,
              },
            };
          });
        },
        resetSimulationPaymentOverrides(): void {
          patchState(state, (current) => ({
            overview: {
              ...current.overview,
              selectedInstalmentPayments: null as number[] | null,
              selectedEarlyPayments: null as number[] | null,
            },
          }));
        },
      };
    },
  ),
  withHooks({
    onInit(store) {
      const router = inject(Router);
      const destroyRef = inject(DestroyRef);
      const localStorage = inject(LocalStorageService);
      const toastStore = inject(ToastStore);

      const handleRouteKey = (): void => {
        if (!router.url.startsWith('/loan')) return;
        const key = router.parseUrl(router.url).queryParams['key'];
        if (typeof key !== 'string' || !key) return;

        localStorage.setItem(LoanEncryptionKeyBase64, key);
        void router.navigateByUrl('/loan');
        toastStore.show('Key was updated', ToastType.Info);
        store.loadRepaymentSchedules();
      };

      router.events
        .pipe(
          filter((event) => event instanceof NavigationEnd),
          takeUntilDestroyed(destroyRef),
        )
        .subscribe(handleRouteKey);
      handleRouteKey();
    },
  }),
);
