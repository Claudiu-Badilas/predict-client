import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  signal,
  computed,
} from '@angular/core';
import { NumberFormatPipe } from 'src/app/shared/pipes/number-format.pipe';
import {
  TransactionCategory,
  TransactionDomain,
} from '../../models/transactions.model';

@Component({
  selector: 'p-transaction-feed',
  imports: [CommonModule, NumberFormatPipe],
  templateUrl: './transaction-feed.component.html',
  styleUrl: './transaction-feed.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TransactionFeedComponent {
  private readonly pageSize = 100;
  private readonly visibleCount = signal(this.pageSize);
  transactions = input<TransactionDomain[]>([]);
  visibleTransactions = computed(() =>
    this.transactions().slice(0, this.visibleCount()),
  );
  hasMoreTransactions = computed(
    () => this.transactions().length > this.visibleCount(),
  );
  searchTerm = input('');
  categorySelected = output<TransactionCategory>();
  providerSelected = output<string>();

  showMore(): void {
    this.visibleCount.update((count) => count + this.pageSize);
  }

  merchantLabel(transaction: TransactionDomain): string {
    return (
      transaction.serviceProvider?.trim() ||
      transaction.merchantName?.trim() ||
      transaction.provider?.trim() ||
      'Transaction'
    );
  }

  selectProvider(transaction: TransactionDomain): void {
    const provider =
      transaction.serviceProvider?.trim() ||
      transaction.merchantName?.trim() ||
      transaction.provider?.trim();
    if (provider) this.providerSelected.emit(provider);
  }

  formatDate(date: Date | null): string {
    return date
      ? new Intl.DateTimeFormat(undefined, {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }).format(date)
      : 'Date unavailable';
  }

  transactionKey(transaction: TransactionDomain, index: number): string {
    return String(
      transaction.id ??
        `${transaction.completionDate?.getTime() ?? transaction.registrationDate?.getTime() ?? 0}-${index}`,
    );
  }

  getCategoryColor(category: TransactionCategory): string {
    const colors: Partial<Record<TransactionCategory, string>> = {
      [TransactionCategory.SUPERMARKET]: '#4CAF50',
      [TransactionCategory.RESTAURANT_FASTFOOD]: '#FF9800',
      [TransactionCategory.CAFE_BAKERY]: '#FFB74D',
      [TransactionCategory.DELIVERY]: '#FF5722',
      [TransactionCategory.GAS_STATION]: '#2196F3',
      [TransactionCategory.TRANSPORT]: '#795548',
      [TransactionCategory.UTILITIES]: '#9C27B0',
      [TransactionCategory.RENT]: '#8D6E63',
      [TransactionCategory.HOME_IMPROVEMENT]: '#8D6E63',
      [TransactionCategory.SHOPPING]: '#E91E63',
      [TransactionCategory.CLOTHING_ACCESSORIES]: '#EC407A',
      [TransactionCategory.ELECTRONICS]: '#26C6DA',
      [TransactionCategory.SPORTS_OUTDOOR]: '#66BB6A',
      [TransactionCategory.PHARMACY]: '#00BCD4',
      [TransactionCategory.HEALTHCARE]: '#FF4081',
      [TransactionCategory.GYM_FITNESS]: '#7C4DFF',
      [TransactionCategory.ENTERTAINMENT]: '#FFC107',
      [TransactionCategory.ONLINE_GAMING]: '#7C4DFF',
      [TransactionCategory.SUBSCRIPTION]: '#009688',
      [TransactionCategory.SALARY]: '#8BC34A',
      [TransactionCategory.RECEIVED]: '#CDDC39',
      [TransactionCategory.INTERNAL_TRANSFER]: '#BDBDBD',
      [TransactionCategory.REFUNDS]: '#4DB6AC',
      [TransactionCategory.BANK_FEES]: '#BDBDBD',
      [TransactionCategory.ATM_WITHDRAWAL]: '#EF5350',
      [TransactionCategory.MOBILE_BILL]: '#3F51B5',
      [TransactionCategory.ACCOMMODATION]: '#FF6F00',
      [TransactionCategory.EDUCATION]: '#66BB6A',
      [TransactionCategory.GIFTS]: '#EC407A',
      [TransactionCategory.TAXES_FINES]: '#F44336',
      [TransactionCategory.OTHER]: '#9E9E9E',
    };
    return colors[category] ?? '#9E9E9E';
  }

  getCategoryLabel(transaction: TransactionDomain): string {
    return transaction.categoryLabel;
  }

  highlightParts(value: string): { text: string; match: boolean }[] {
    const query = this.searchTerm().trim();
    if (!query || !value) return [{ text: value, match: false }];

    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parts = value.split(new RegExp(`(${escapedQuery})`, 'gi'));
    return parts.map((text) => ({
      text,
      match: text.toLocaleLowerCase() === query.toLocaleLowerCase(),
    }));
  }
}
