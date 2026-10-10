import { computed } from '@angular/core';
import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';
import { DateUtils } from 'src/app/shared/utils/date.utils';
import { ReceiptDomain } from '../models/receipts-domain.model';

interface ReceiptsViewState {
  searchTerm: string;
  viewMode: 'all' | 'monthly' | 'yearly';
}

export interface State {
  receipts: ReceiptDomain[];
  startDate: Date;
  endDate: Date;
  receiptsView: ReceiptsViewState;
}

const initialState: State = {
  receipts: [],
  startDate: new Date('2019-01-01'),
  endDate: new Date(),
  receiptsView: { searchTerm: '', viewMode: 'all' },
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
  withMethods((state) => ({
    setReceipts(receipts: ReceiptDomain[]): void {
      patchState(state, { receipts });
    },
    setDateRange(startDate: Date, endDate: Date): void {
      patchState(state, { startDate, endDate });
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
  })),
);
