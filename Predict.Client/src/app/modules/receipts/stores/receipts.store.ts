import { HttpErrorResponse } from '@angular/common/http';
import { computed, inject } from '@angular/core';
import { EMPTY, catchError, finalize, pipe, switchMap, tap } from 'rxjs';
import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { ToastStore } from 'src/app/core/toast-notifications/toast.store';
import { ToastType } from 'src/app/core/toast-notifications/models/toast-type.model';
import { LayoutStore } from 'src/app/store/layout.store';
import { ReceiptDomain } from '../models/receipts-domain.model';
import { ReceiptsService } from '../services/receipts.service';

interface ReceiptsViewState {
  searchTerm: string;
  viewMode: 'all' | 'monthly' | 'yearly';
}

export interface State {
  receipts: ReceiptDomain[];
  startDate: Date;
  endDate: Date;
  receiptsView: ReceiptsViewState;
  loading: boolean;
  error: string | null;
}

const initialState: State = {
  receipts: [],
  startDate: new Date('2019-01-01'),
  endDate: new Date(),
  receiptsView: { searchTerm: '', viewMode: 'all' },
  loading: false,
  error: null,
};

export const ReceiptsStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed((state) => ({
    availableReceipts: computed(() => {
      const searchTerm = state.receiptsView.searchTerm().trim().toLowerCase();
      if (!searchTerm) return state.receipts();

      const terms = searchTerm
        .split(',')
        .map((term) => term.trim())
        .filter(Boolean);
      return state
        .receipts()
        .filter((receipt) =>
          terms.some(
            (term) =>
              receipt.provider?.toLowerCase().includes(term) ||
              receipt.products.some((product) =>
                product.name.toLowerCase().includes(term),
              ),
          ),
        );
    }),
  })),
  withMethods(
    (
      state,
      receiptsService = inject(ReceiptsService),
      layoutStore = inject(LayoutStore),
      toastStore = inject(ToastStore),
    ) => {
      const load = rxMethod<{ startDate: Date; endDate: Date }>(
        pipe(
          switchMap(({ startDate, endDate }) => {
            patchState(state, { loading: true, error: null });
            layoutStore.beginOperation();

            return receiptsService.getReceipts(startDate, endDate).pipe(
              tap((receipts) => patchState(state, { receipts })),
              catchError((error: unknown) => {
                const message =
                  error instanceof HttpErrorResponse
                    ? error.status === 0
                      ? 'Could not reach the receipts API.'
                      : `Receipts API request failed (${error.status}).`
                    : error instanceof Error
                      ? error.message
                      : 'Failed to load receipts.';
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
        loadReceipts(): void {
          load({ startDate: state.startDate(), endDate: state.endDate() });
        },
        setDateRange(startDate: Date, endDate: Date): void {
          patchState(state, { startDate, endDate });
          load({ startDate, endDate });
        },
        setSearchTerm(searchTerm: string): void {
          patchState(state, (current) => ({
            receiptsView: { ...current.receiptsView, searchTerm },
          }));
        },
        setReceiptsViewMode(viewMode: State['receiptsView']['viewMode']): void {
          patchState(state, (current) => ({
            receiptsView: { ...current.receiptsView, viewMode },
          }));
        },
      };
    },
  ),
);
