import {
  ChangeDetectionStrategy,
  computed,
  Component,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReceiptsStore } from 'src/app/modules/receipts/stores/receipts.store';
import { RangeSelectorComponent } from 'src/app/shared/components/date-range-picker/date-range-picker.component';
import { PlatformToggleComponent } from 'src/app/shared/components/platform-toggle/platform-toggle.component';
import { SearchInputComponent } from 'src/app/shared/components/search-input/search-input.component';
import { TopBarComponent } from 'src/app/shared/components/top-bar/top-bar.component';
import {
  MostCommonProductsComponent,
  ReceiptSortMode,
} from './receipts-products/components/most-common-products/most-common-products.component';
import { ReceiptInsightsComponent } from './components/receipt-insights/receipt-insights.component';

@Component({
  selector: 'p-receipts',
  imports: [
    CommonModule,
    RangeSelectorComponent,
    PlatformToggleComponent,
    SearchInputComponent,
    TopBarComponent,
    MostCommonProductsComponent,
    ReceiptInsightsComponent,
  ],
  templateUrl: './receipts.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./receipts.component.scss'],
})
export class ReceiptsComponent {
  private readonly receiptsStore = inject(ReceiptsStore);
  startDate = this.receiptsStore.startDate;
  endDate = this.receiptsStore.endDate;
  viewMode = this.receiptsStore.receiptsView.viewMode;
  searchTerm = this.receiptsStore.receiptsView.searchTerm;
  receipts = this.receiptsStore.availableReceipts;
  receiptSortMode = signal<ReceiptSortMode>('newest');

  readonly minDate = new Date('2016-01-01');
  readonly now = new Date();
  readonly selectedViewLabel = computed(() => {
    const viewMode = this.viewMode();
    if (viewMode === 'all') return 'All';
    if (viewMode === 'yearly') return 'Yearly';
    return 'Monthly';
  });

  constructor() {
    this.receiptsStore.loadReceipts();
  }

  onToggle(value: string): void {
    this.receiptsStore.setReceiptsViewMode(
      value.toLowerCase() as 'all' | 'monthly' | 'yearly',
    );
  }

  toggleDateSort(): void {
    this.receiptSortMode.update((mode) =>
      mode === 'newest' ? 'oldest' : 'newest',
    );
  }

  toggleAmountSort(): void {
    this.receiptSortMode.update((mode) =>
      mode === 'amount-desc' ? 'amount-asc' : 'amount-desc',
    );
  }

  handleRangeChange(value: any): void {
    this.receiptsStore.setDateRange(value.startDate, value.endDate);
  }

  onSearch(value: string): void {
    this.receiptsStore.setSearchTerm(value);
  }
}
