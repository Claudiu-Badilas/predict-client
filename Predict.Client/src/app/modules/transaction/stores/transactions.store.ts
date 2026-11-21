import { HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { EMPTY, catchError, finalize, pipe, switchMap, tap } from 'rxjs';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { ToastStore } from 'src/app/core/toast-notifications/toast.store';
import { ToastType } from 'src/app/core/toast-notifications/models/toast-type.model';
import { LayoutStore } from 'src/app/store/layout.store';
import { TransactionDomain } from '../models/transactions.model';
import { TransactionService } from '../services/transaction.service';

export interface State {
  transactions: TransactionDomain[];
  economii: TransactionDomain[];
  startDate: Date;
  endDate: Date;
  viewMode: 'all' | 'monthly' | 'yearly';
  loading: boolean;
  error: string | null;
}

const initialState: State = {
  transactions: [],
  economii: [],
  startDate: new Date('2017-01-01'),
  endDate: new Date(),
  viewMode: 'monthly',
  loading: false,
  error: null,
};

export const TransactionsStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods(
    (
      state,
      transactionService = inject(TransactionService),
      layoutStore = inject(LayoutStore),
      toastStore = inject(ToastStore),
    ) => {
      const load = rxMethod<{ startDate: Date; endDate: Date }>(
        pipe(
          switchMap(({ startDate, endDate }) => {
            patchState(state, { loading: true, error: null });
            layoutStore.beginOperation();

            return transactionService.getTransactions(startDate, endDate).pipe(
              tap(({ transactions, economii }) =>
                patchState(state, { transactions, economii }),
              ),
              catchError((error: unknown) => {
                const message =
                  error instanceof HttpErrorResponse
                    ? error.status === 0
                      ? 'Could not reach the transactions API.'
                      : `Transactions API request failed (${error.status}).`
                    : error instanceof Error
                      ? error.message
                      : 'Failed to load transactions.';
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
        loadTransactions(): void {
          load({ startDate: state.startDate(), endDate: state.endDate() });
        },
        setDateRange(startDate: Date, endDate: Date): void {
          patchState(state, { startDate, endDate });
          load({ startDate, endDate });
        },
        setViewMode(viewMode: State['viewMode']): void {
          patchState(state, { viewMode });
        },
      };
    },
  ),
);
