import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import * as TransactionsActions from 'src/app/modules/transaction/actions/transactions.actions';
import * as fromTransactions from 'src/app/modules/transaction/reducers/transactions.reducer';
import { TransactionService_STORAGE_KEY } from 'src/app/modules/transaction/services/transaction.service';
import {
  StorageManagerConfig,
  StorageManagerModalComponent,
} from 'src/app/shared/components/modals/storage-manager/storage-manager-modal.component';

@Component({
  selector: 'p-transactions-settings',
  imports: [StorageManagerModalComponent],
  templateUrl: './transaction-settings.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class TransactionsSettingsComponent {
  private readonly store = inject(Store<fromTransactions.State>);

  readonly config: StorageManagerConfig = {
    title: 'Transaction storage',
    storageKey: TransactionService_STORAGE_KEY,
    obsoleteStorageKeys: [`${TransactionService_STORAGE_KEY}_ManualUpload`],
    loadFailureActionType: TransactionsActions.loadTransactionsFailure.type,
    uploadValidator: (data) => {
      if (Array.isArray(data)) return true;
      if (!data || typeof data !== 'object') return false;

      const response = data as Record<string, unknown>;
      return ['transactions', 'Transactions', 'economii', 'Economii'].some(
        (key) => Array.isArray(response[key]),
      );
    },
  };

  reloadData(): void {
    this.store.dispatch(TransactionsActions.loadTransactions());
  }
}
