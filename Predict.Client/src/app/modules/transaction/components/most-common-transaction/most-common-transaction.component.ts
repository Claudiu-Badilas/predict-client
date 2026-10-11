import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ElementRef,
  ViewChild,
  Component,
  computed,
  input,
  output,
  signal,
} from '@angular/core';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { ScrollableDirective } from 'src/app/shared/directives/scrollable.directive';
import { NumberFormatPipe } from 'src/app/shared/pipes/number-format.pipe';
import {
  TransactionCategory,
  TransactionDomain,
} from '../../models/transactions.model';
import { TransactionFeedComponent } from '../transaction-feed/transaction-feed.component';
import { RangeSelectorComponent } from 'src/app/shared/components/date-range-picker/date-range-picker.component';
import { DateRangePicker } from 'src/app/shared/components/date-range-picker/models/date-range-picker.model';
import { PlatformToggleComponent } from 'src/app/shared/components/platform-toggle/platform-toggle.component';

type TransactionSort = 'recent' | 'oldest' | 'amount-asc' | 'amount-desc';

interface PeriodGroup {
  id: string;
  title: string;
  year: number;
  monthIndex?: number;
  totalIncome: number;
  totalExpense: number;
  difference: number;
  transactionCount: number;
  transactions: TransactionDomain[];
  isExpanded: boolean;
  month?: string;
}

@Component({
  selector: 'p-most-common-transaction',
  imports: [
    CommonModule,
    NumberFormatPipe,
    ScrollableDirective,
    NgbTooltip,
    TransactionFeedComponent,
    RangeSelectorComponent,
    PlatformToggleComponent,
  ],
  templateUrl: './most-common-transaction.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './most-common-transaction.component.scss',
})
export class MostCommonTransactionComponent {
  @ViewChild('transactionsScroll')
  private transactionsScroll?: ElementRef<HTMLElement>;
  transactions = input<TransactionDomain[]>([]);
  economiiTransactions = input<TransactionDomain[]>([]);
  viewMode = input<'all' | 'monthly' | 'yearly'>('monthly');
  viewModeChange = output<'all' | 'monthly' | 'yearly'>();
  startDate = input.required<Date>();
  endDate = input.required<Date>();
  minDate = input.required<Date>();
  maxDate = input.required<Date>();
  dateRangeChange = output<DateRangePicker>();

  searchTerm = signal('');
  showEconomii = signal(false);
  sortMode = signal<TransactionSort>('recent');
  selectedCategory = signal<TransactionCategory | null>(null);
  selectedProvider = signal<string | null>(null);
  datasetChanged = output<boolean>();
  storageSettingsRequested = output<void>();

  private normalizedSearch = computed(() =>
    this.searchTerm().trim().toLowerCase(),
  );

  selectedTransaction = computed(() =>
    (this.showEconomii()
      ? this.economiiTransactions()
      : this.transactions()
    ).filter((transaction) => this.matchesSearch(transaction)),
  );

  economiiTotal = computed(() =>
    this.filteredTransactions().reduce(
      (total, transaction) => total + (transaction.amount ?? 0),
      0,
    ),
  );

  setDataset(showEconomii: boolean): void {
    this.showEconomii.set(showEconomii);
    this.datasetChanged.emit(showEconomii);
    this.selectedProvider.set(null);
    this.clearSearch();
    this.scrollTransactionsToTop();
  }

  filteredTransactions = computed(() => {
    const category = this.selectedCategory();
    const provider = this.selectedProvider()?.toLocaleLowerCase();
    return this.selectedTransaction().filter((transaction) => {
      if (category && transaction.category !== category) return false;
      if (provider) {
        const transactionProvider = (
          transaction.serviceProvider?.trim() ||
          transaction.merchantName?.trim() ||
          transaction.provider?.trim() ||
          ''
        ).toLocaleLowerCase();
        if (transactionProvider !== provider) return false;
      }
      return true;
    });
  });

  allTransactions = computed(() =>
    this.sortTransactionRecords(this.filteredTransactions()),
  );

  private expandedPeriodId = signal<string | null>(null);

  togglePeriod(period: PeriodGroup) {
    const currentExpanded = this.expandedPeriodId();
    if (currentExpanded === period.id) {
      this.expandedPeriodId.set(null);
    } else {
      this.expandedPeriodId.set(period.id);
    }
  }

  formatDay(date: Date | null): string {
    if (!date) return '';
    const month = date.toLocaleString('default', { month: 'short' });
    const day = date.getDate();
    return `${day} ${month}`;
  }

  currentPeriods = computed((): PeriodGroup[] => {
    if (this.viewMode() === 'monthly') {
      return this.groupedByMonth();
    } else if (this.viewMode() === 'yearly') {
      return this.groupedByYear();
    }
    return [];
  });

  private groupedByMonth = computed((): PeriodGroup[] => {
    const txs = this.filteredTransactions();
    if (!txs?.length) return [];

    const map = new Map<string, TransactionDomain[]>();
    for (const tx of txs) {
      const date = tx.completionDate || tx.registrationDate;
      if (!date) continue;
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(tx);
    }

    return Array.from(map.entries())
      .map(([key, txs]) => {
        const [year, monthIndex] = key.split('-').map(Number);
        const month = new Date(year, monthIndex).toLocaleString('default', {
          month: 'short',
        });
        const id = `month-${year}-${monthIndex}`;

        const processedData = this.processTransactions(txs);

        return {
          id,
          title: `${month} ${year}`,
          year,
          monthIndex,
          month,
          ...processedData,
          isExpanded: this.expandedPeriodId() === id,
        };
      })
      .sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return b.monthIndex! - a.monthIndex!;
      });
  });

  private groupedByYear = computed((): PeriodGroup[] => {
    const txs = this.filteredTransactions();
    if (!txs?.length) return [];

    const map = new Map<number, TransactionDomain[]>();
    for (const tx of txs) {
      const date = tx.completionDate || tx.registrationDate;
      if (!date) continue;
      const year = date.getFullYear();
      if (!map.has(year)) map.set(year, []);
      map.get(year)!.push(tx);
    }

    return Array.from(map.entries())
      .map(([year, txs]) => {
        const id = `year-${year}`;
        const processedData = this.processTransactions(txs);

        return {
          id,
          title: `${year}`,
          year,
          ...processedData,
          isExpanded: this.expandedPeriodId() === id,
        };
      })
      .sort((a, b) => b.year - a.year);
  });

  private processTransactions(txs: TransactionDomain[]) {
    const totalIncome = txs
      .filter((t) => (t.amount ?? 0) > 0)
      .reduce((s, t) => s + (t.amount ?? 0), 0);

    const totalExpense = Math.abs(
      txs
        .filter((t) => (t.amount ?? 0) < 0)
        .reduce((s, t) => s + (t.amount ?? 0), 0),
    );

    return {
      totalIncome,
      totalExpense,
      difference: totalIncome - totalExpense,
      transactionCount: txs.length,
      transactions: this.sortTransactionRecords(txs),
    };
  }

  private sortTransactionRecords(
    transactions: TransactionDomain[],
  ): TransactionDomain[] {
    const dateValue = (transaction: TransactionDomain) =>
      (transaction.completionDate || transaction.registrationDate)?.getTime() ??
      0;

    return [...transactions].sort((a, b) => {
      const mode = this.sortMode();
      if (mode === 'amount-asc' || mode === 'amount-desc') {
        const amountDifference =
          Math.abs(a.amount ?? 0) - Math.abs(b.amount ?? 0);
        if (amountDifference !== 0) {
          return mode === 'amount-asc' ? amountDifference : -amountDifference;
        }
      }

      const dateDifference = dateValue(b) - dateValue(a);
      return mode === 'oldest' ? -dateDifference : dateDifference;
    });
  }

  totalIncome = computed(
    () =>
      this.filteredTransactions()
        ?.filter((tx) => (tx.amount ?? 0) > 0)
        .reduce((s, tx) => s + (tx.amount ?? 0), 0) ?? 0,
  );

  totalExpense = computed(() =>
    Math.abs(
      this.filteredTransactions()
        ?.filter((tx) => (tx.amount ?? 0) < 0)
        .reduce((s, tx) => s + (tx.amount ?? 0), 0) ?? 0,
    ),
  );

  totalTransactions = computed(() => this.filteredTransactions().length);

  selectCategory(category: TransactionCategory): void {
    this.selectedCategory.set(
      this.selectedCategory() === category ? null : category,
    );
    this.selectedProvider.set(null);
    this.scrollTransactionsToTop();
  }

  selectedCategoryLabel(): string {
    const category = this.selectedCategory();
    return (
      this.selectedTransaction().find(
        (transaction) => transaction.category === category,
      )?.categoryLabel ?? ''
    );
  }

  selectProvider(provider: string): void {
    const selected = this.selectedProvider()?.toLocaleLowerCase();
    this.selectedProvider.set(
      selected === provider.toLocaleLowerCase() ? null : provider,
    );
    this.selectedCategory.set(null);
    this.scrollTransactionsToTop();
  }

  clearTransactionFilter(): void {
    this.selectedCategory.set(null);
    this.selectedProvider.set(null);
    this.scrollTransactionsToTop();
  }

  private matchesSearch(transaction: TransactionDomain): boolean {
    const query = this.normalizedSearch();
    if (!query) return true;

    return [
      transaction.serviceProvider,
      transaction.merchantName,
      transaction.description,
      transaction.categoryLabel,
    ]
      .filter(Boolean)
      .some(
        (value) =>
          typeof value === 'string' && value.toLowerCase().includes(query),
      );
  }

  onSearchInput(event: Event) {
    this.searchTerm.set((event.target as HTMLInputElement).value);
    this.scrollTransactionsToTop();
  }

  toggleDateSort(): void {
    this.sortMode.update((mode) => (mode === 'oldest' ? 'recent' : 'oldest'));
    this.scrollTransactionsToTop();
  }

  toggleAmountSort(): void {
    this.sortMode.update((mode) =>
      mode === 'amount-desc' ? 'amount-asc' : 'amount-desc',
    );
    this.scrollTransactionsToTop();
  }

  setViewMode(viewMode: 'all' | 'monthly' | 'yearly') {
    this.viewModeChange.emit(viewMode);
    this.scrollTransactionsToTop();
  }

  setViewModeFromToggle(value: string): void {
    if (value === 'all' || value === 'monthly' || value === 'yearly') {
      this.setViewMode(value);
    }
  }

  clearSearch() {
    this.searchTerm.set('');
    this.scrollTransactionsToTop();
  }

  onDateRangeChange(range: DateRangePicker): void {
    this.dateRangeChange.emit(range);
    this.scrollTransactionsToTop();
  }

  private scrollTransactionsToTop(): void {
    requestAnimationFrame(() => {
      this.transactionsScroll?.nativeElement.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    });
  }
}
