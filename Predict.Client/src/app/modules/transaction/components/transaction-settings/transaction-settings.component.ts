import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TransactionsStore } from 'src/app/modules/transaction/stores/transactions.store';
import { TransactionService_STORAGE_KEY } from 'src/app/modules/transaction/services/transaction.service';
import {
  StorageManagerConfig,
  StorageManagerModalComponent,
} from 'src/app/shared/components/modals/storage-manager/storage-manager-modal.component';

@Component({
  selector: 'p-transactions-settings',
  imports: [StorageManagerModalComponent],
  templateUrl: './transaction-settings.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TransactionsSettingsComponent {
  private readonly store = inject(TransactionsStore);

  readonly config: StorageManagerConfig = {
    title: 'Transaction storage',
    storageKey: TransactionService_STORAGE_KEY,
    obsoleteStorageKeys: [`${TransactionService_STORAGE_KEY}_ManualUpload`],
    loadError: this.store.error,
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
    this.store.loadTransactions();
  }
}
