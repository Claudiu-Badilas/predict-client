import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';
import { TransactionDomain } from '../models/transactions.model';

export interface State {
  transactions: TransactionDomain[];
  economii: TransactionDomain[];
  startDate: Date;
  endDate: Date;
  viewMode: 'all' | 'monthly' | 'yearly';
}

const initialState: State = {
  transactions: [],
  economii: [],
  startDate: new Date('2016-01-01'),
  endDate: new Date(),
  viewMode: 'all',
};

export const TransactionsStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed((state) => ({
    availableTransactions: state.transactions,
    availableEconomii: state.economii,
  })),
  withMethods((state) => ({
    setTransactions(
      transactions: TransactionDomain[],
      economii: TransactionDomain[],
    ): void {
      patchState(state, { transactions, economii });
    },
    setDateRange(startDate: Date, endDate: Date): void {
      patchState(state, { startDate, endDate });
    },
    setViewMode(viewMode: State['viewMode']): void {
      patchState(state, { viewMode });
    },
  })),
);
