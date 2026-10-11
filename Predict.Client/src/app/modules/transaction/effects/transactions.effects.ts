import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of, timeout } from 'rxjs';
import {
  catchError,
  finalize,
  switchMap,
  tap,
  withLatestFrom,
} from 'rxjs/operators';

import { Store } from '@ngrx/store';
import * as TransactionsActions from 'src/app/modules/transaction/actions/transactions.actions';
import { TransactionsStore } from 'src/app/modules/transaction/reducers/transactions.reducer';
import * as LayoutActions from 'src/app/store/actions/layout.actions';
import * as ToastActions from 'src/app/core/toast-notifications/actions/toast-notification.actions';
import { ToastType } from 'src/app/core/toast-notifications/models/toast-type.model';
import { TransactionService } from '../services/transaction.service';

@Injectable()
export class TransactionsEffects {
  constructor(
    private readonly actions$: Actions,
    private readonly store: Store,
    private readonly _transactionService: TransactionService,
  ) {}

  private readonly transactionsStore = inject(TransactionsStore);

  syncState$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(
          TransactionsActions.setTransactionsSuccess,
          TransactionsActions.dateRangeChanged,
          TransactionsActions.viewModeChanged,
        ),
        tap((action) => {
          if ('transactions' in action)
            this.transactionsStore.setTransactions(
              action.transactions,
              action.economii,
            );
          if ('startDate' in action)
            this.transactionsStore.setDateRange(
              action.startDate,
              action.endDate,
            );
          if ('viewMode' in action)
            this.transactionsStore.setViewMode(action.viewMode);
        }),
      ),
    { dispatch: false },
  );

  loadTransactions$ = createEffect(() =>
    this.actions$.pipe(
      ofType(
        TransactionsActions.loadTransactions,
        TransactionsActions.dateRangeChanged,
      ),
      tap(() => this.store.dispatch(LayoutActions.spinnerOn())),
      withLatestFrom(
        toObservable(this.transactionsStore.startDate),
        toObservable(this.transactionsStore.endDate),
      ),
      switchMap(([action, currentStartDate, currentEndDate]) => {
        const { startDate, endDate } =
          'startDate' in action
            ? action
            : { startDate: currentStartDate, endDate: currentEndDate };

        return this._transactionService
          .getTransactions(startDate, endDate)
          .pipe(
            switchMap(({ transactions, economii }) =>
              of(
                TransactionsActions.setTransactionsSuccess({
                  transactions,
                  economii,
                }),
              ),
            ),
            catchError((error: unknown) =>
              of(
                TransactionsActions.loadTransactionsFailure({
                  message:
                    error instanceof HttpErrorResponse
                      ? error.status === 0
                        ? 'Could not reach the transactions API.'
                        : `Transactions API request failed (${error.status}).`
                      : error instanceof Error
                        ? error.message
                        : 'Failed to load transactions.',
                }),
                ToastActions.showToast({
                  message: 'Something went wrong. Please try again.',
                  toastType: ToastType.Error,
                }),
              ),
            ),
            finalize(() => this.store.dispatch(LayoutActions.spinnerOff())),
          );
      }),
    ),
  );
}
