import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import {
  catchError,
  finalize,
  switchMap,
  tap,
  withLatestFrom,
} from 'rxjs/operators';

import { Store } from '@ngrx/store';
import * as ReceiptsActions from 'src/app/modules/receipts/actions/receipts.actions';
import { ReceiptsStore } from 'src/app/modules/receipts/reducers/receipts.reducer';
import * as LayoutActions from 'src/app/store/actions/layout.actions';
import * as ToastActions from 'src/app/core/toast-notifications/actions/toast-notification.actions';
import { ToastType } from 'src/app/core/toast-notifications/models/toast-type.model';
import { ReceiptsService } from '../services/receipts.service';

@Injectable()
export class ReceiptsEffects {
  constructor(
    private readonly actions$: Actions,
    private readonly store: Store,
    private readonly _receiptsService: ReceiptsService,
  ) {}

  private readonly receiptsStore = inject(ReceiptsStore);

  syncState$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(
          ReceiptsActions.setReceiptsSuccess,
          ReceiptsActions.dateRangeChanged,
          ReceiptsActions.searchTermChanged,
          ReceiptsActions.receiptsViewModeChanged,
        ),
        tap((action) => {
          if ('receipts' in action)
            this.receiptsStore.setReceipts(action.receipts);
          if ('startDate' in action)
            this.receiptsStore.setDateRange(action.startDate, action.endDate);
          if ('searchTerm' in action)
            this.receiptsStore.setSearchTerm(action.searchTerm);
          if ('viewMode' in action)
            this.receiptsStore.setReceiptsViewMode(action.viewMode);
        }),
      ),
    { dispatch: false },
  );

  loadReceipts$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ReceiptsActions.loadReceipts),
      tap(() => this.store.dispatch(LayoutActions.spinnerOn())),
      withLatestFrom(
        toObservable(this.receiptsStore.startDate),
        toObservable(this.receiptsStore.endDate),
      ),
      switchMap(([, startDate, endDate]) =>
        this._receiptsService.getReceipts(startDate, endDate).pipe(
          switchMap((receipts) =>
            of(ReceiptsActions.setReceiptsSuccess({ receipts })),
          ),
          catchError((error: unknown) =>
            of(
              ReceiptsActions.loadReceiptsFailure({
                message:
                  error instanceof HttpErrorResponse
                    ? error.status === 0
                      ? 'Could not reach the receipts API.'
                      : `Receipts API request failed (${error.status}).`
                    : error instanceof Error
                      ? error.message
                      : 'Failed to load receipts.',
              }),
              ToastActions.showToast({
                message: 'Something went wrong. Please try again.',
                toastType: ToastType.Error,
              }),
            ),
          ),
          finalize(() => this.store.dispatch(LayoutActions.spinnerOff())),
        ),
      ),
    ),
  );
}
