import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import * as ReceiptsActions from 'src/app/modules/receipts/actions/receipts.actions';
import { ReceiptsStore } from 'src/app/modules/receipts/reducers/receipts.reducer';
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
  changeDetection: ChangeDetectionStrategy.Eager,
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

  minDate = new Date('2016-01-01');
  now = new Date();

  constructor(
    private readonly store: Store,
    private readonly modalService: NgbModal,
  ) {
    this.store.dispatch(ReceiptsActions.loadReceipts());
  }

  onToggle(value: string): void {
    this.store.dispatch(
      ReceiptsActions.receiptsViewModeChanged({
        viewMode: value.toLowerCase() as 'all' | 'monthly' | 'yearly',
      }),
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

  getSelectedViewLabel(): string {
    if (this.viewMode() === 'all') return 'All';
    if (this.viewMode() === 'yearly') return 'Yearly';
    return 'Monthly';
  }

  handleRangeChange(value: any): void {
    this.store.dispatch(
      ReceiptsActions.dateRangeChanged({
        startDate: value.startDate,
        endDate: value.endDate,
      }),
    );
    this.store.dispatch(ReceiptsActions.loadReceipts());
  }

  onSearch(value: string): void {
    this.store.dispatch(
      ReceiptsActions.searchTermChanged({ searchTerm: value }),
    );
  }
}
