import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  signal,
} from '@angular/core';
import { NumberFormatPipe } from 'src/app/shared/pipes/number-format.pipe';
import { ReceiptDomain } from '../../../models/receipts-domain.model';

interface ReceiptPeriod {
  id: string;
  title: string;
  receipts: ReceiptDomain[];
  total: number;
}

interface MatchingProduct {
  product: ReceiptDomain['products'][number];
  receipt: ReceiptDomain;
}

interface MatchingProductPeriod {
  id: string;
  title: string;
  products: MatchingProduct[];
  total: number;
}

export type ReceiptSortMode =
  'newest' | 'oldest' | 'amount-asc' | 'amount-desc';

@Component({
  selector: 'p-most-common-products',
  imports: [CommonModule, NumberFormatPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './most-common-products.component.html',
  styleUrl: './most-common-products.component.scss',
})
export class MostCommonProductsComponent {
  receipts = input<ReceiptDomain[]>([]);
  viewMode = input<'all' | 'monthly' | 'yearly'>('monthly');
  sortMode = input<ReceiptSortMode>('newest');
  searchTerm = input('');
  productSelected = output<string>();
  selectedProvider = signal<string | null>(null);
  expandedPeriods = signal<Record<string, boolean>>({});
  expandedReceiptId = signal<number | null>(null);

  filteredReceipts = computed(() => {
    const selectedProvider = this.selectedProvider()?.toLocaleLowerCase();
    if (!selectedProvider) return this.receipts();

    return this.receipts().filter(
      (receipt) =>
        receipt.provider?.trim().toLocaleLowerCase() === selectedProvider,
    );
  });

  matchingProducts = computed(() => {
    const terms = this.searchTerm()
      .split(',')
      .map((term) => term.trim().toLocaleLowerCase())
      .filter(Boolean);
    if (!terms.length) return [];

    const matches = this.filteredReceipts().flatMap((receipt) =>
      receipt.products
        .filter((product) =>
          terms.some((term) => product.name.toLocaleLowerCase().includes(term)),
        )
        .map((product) => ({ product, receipt })),
    );

    const mode = this.sortMode();
    return matches.sort((first, second) => {
      if (mode === 'amount-asc' || mode === 'amount-desc') {
        const amountDifference =
          (first.product.price ?? 0) * (first.product.quantity ?? 0) -
          (second.product.price ?? 0) * (second.product.quantity ?? 0);
        if (amountDifference !== 0) {
          return mode === 'amount-asc' ? amountDifference : -amountDifference;
        }
      }

      const dateDifference =
        (second.receipt.date?.getTime() ?? 0) -
        (first.receipt.date?.getTime() ?? 0);
      return mode === 'oldest' ? -dateDifference : dateDifference;
    });
  });

  matchingProductsTotal = computed(() =>
    this.matchingProducts().reduce(
      (total, match) =>
        total + (match.product.price ?? 0) * (match.product.quantity ?? 0),
      0,
    ),
  );

  matchingProductPeriods = computed((): MatchingProductPeriod[] => {
    const groups = new Map<string, MatchingProduct[]>();
    const groupByYear = this.viewMode() === 'yearly';

    for (const match of this.matchingProducts()) {
      const date = match.receipt.date;
      const key = date
        ? groupByYear
          ? `${date.getFullYear()}`
          : `${date.getFullYear()}-${date.getMonth()}`
        : 'undated';
      const group = groups.get(key) ?? [];
      group.push(match);
      groups.set(key, group);
    }

    return Array.from(groups.entries())
      .map(([key, products]) => {
        const [year, monthIndex] = key.split('-').map(Number);
        const title =
          key === 'undated'
            ? 'Date unavailable'
            : groupByYear
              ? key
              : new Date(year, monthIndex).toLocaleString('default', {
                  month: 'short',
                  year: 'numeric',
                });

        return {
          id: `${groupByYear ? 'year' : 'month'}-${key}`,
          title,
          products,
          total: products.reduce(
            (sum, match) =>
              sum + (match.product.price ?? 0) * (match.product.quantity ?? 0),
            0,
          ),
        };
      })
      .sort((first, second) => {
        const firstDate = first.products[0].receipt.date?.getTime() ?? -1;
        const secondDate = second.products[0].receipt.date?.getTime() ?? -1;
        return secondDate - firstDate;
      });
  });

  totalRevenue = computed(() =>
    this.filteredReceipts().reduce(
      (total, receipt) => total + this.receiptTotal(receipt),
      0,
    ),
  );

  receiptFrequency = computed(() => this.filteredReceipts().length);

  allReceipts = computed(() => this.sortReceipts(this.filteredReceipts()));

  selectProvider(provider: string): void {
    const normalizedProvider = provider.trim().toLocaleLowerCase();
    if (!normalizedProvider) return;

    this.selectedProvider.update((current) =>
      current?.toLocaleLowerCase() === normalizedProvider
        ? null
        : provider.trim(),
    );
    this.expandedReceiptId.set(null);
  }

  clearProviderSelection(): void {
    this.selectedProvider.set(null);
    this.expandedReceiptId.set(null);
  }

  isProviderSelected(provider: string | null | undefined): boolean {
    return (
      !!provider?.trim() &&
      this.selectedProvider()?.toLocaleLowerCase() ===
        provider.trim().toLocaleLowerCase()
    );
  }

  providerInitial(provider: string | null | undefined): string {
    return provider?.trim().charAt(0).toLocaleUpperCase() || 'R';
  }

  providerHue(provider: string | null | undefined): number {
    const normalized = provider?.trim().toLocaleLowerCase() || 'receipt';
    let hash = 2166136261;
    for (let index = 0; index < normalized.length; index++) {
      hash = Math.imul(hash ^ normalized.charCodeAt(index), 16777619);
    }
    return (hash >>> 0) % 360;
  }

  providerBrand(provider: string | null | undefined): string | null {
    const normalized = provider?.trim().toLocaleLowerCase() ?? '';
    if (normalized.includes('lidl')) return 'lidl';
    if (normalized.includes('carrefour')) return 'carrefour';
    if (normalized.includes('kaufland')) return 'kaufland';
    return null;
  }

  productSummary(receipt: ReceiptDomain): string {
    const names = receipt.products
      .slice(0, 3)
      .map((product) => product.name)
      .filter(Boolean);
    if (!names.length) return 'No item details';

    const remaining = receipt.products.length - names.length;
    return `${names.join(', ')}${remaining > 0 ? ` +${remaining} more` : ''}`;
  }

  highlightParts(value: string): { text: string; match: boolean }[] {
    const terms = this.searchTerm()
      .split(',')
      .map((term) => term.trim())
      .filter(Boolean)
      .sort((first, second) => second.length - first.length);
    if (!terms.length || !value) return [{ text: value, match: false }];

    const escapedTerms = terms.map((term) =>
      term.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&'),
    );
    const parts = value.split(new RegExp(`(${escapedTerms.join('|')})`, 'gi'));
    return parts.map((text) => ({
      text,
      match: terms.some(
        (term) => text.toLocaleLowerCase() === term.toLocaleLowerCase(),
      ),
    }));
  }

  currentPeriods = computed((): ReceiptPeriod[] => {
    const groups = new Map<string, ReceiptDomain[]>();
    const groupByYear = this.viewMode() === 'yearly';

    for (const receipt of this.filteredReceipts()) {
      if (!receipt.date) continue;
      const year = receipt.date.getFullYear();
      const month = receipt.date.getMonth();
      const key = groupByYear ? `${year}` : `${year}-${month}`;
      const group = groups.get(key) ?? [];
      group.push(receipt);
      groups.set(key, group);
    }

    return Array.from(groups.entries())
      .map(([key, receipts]) => {
        const [year, monthIndex] = key.split('-').map(Number);
        const title = groupByYear
          ? `${year}`
          : new Date(year, monthIndex).toLocaleString('default', {
              month: 'short',
              year: 'numeric',
            });
        return {
          id: `${groupByYear ? 'year' : 'month'}-${key}`,
          title,
          receipts: this.sortReceipts(receipts),
          total: receipts.reduce(
            (sum, receipt) => sum + this.receiptTotal(receipt),
            0,
          ),
        };
      })
      .sort(
        (first, second) =>
          second.receipts[0].date!.getTime() -
          first.receipts[0].date!.getTime(),
      );
  });

  toggleReceipt(receiptId: number): void {
    this.expandedReceiptId.update((current) =>
      current === receiptId ? null : receiptId,
    );
  }

  selectProduct(productName: string): void {
    this.productSelected.emit(productName);
  }

  receiptTotal(receipt: ReceiptDomain): number {
    if (receipt.totalPrice !== null && receipt.totalPrice !== undefined) {
      return receipt.totalPrice;
    }
    return receipt.products.reduce(
      (sum, product) => sum + (product.price ?? 0) * (product.quantity ?? 0),
      0,
    );
  }

  formatDay(date: Date | null): string {
    return date
      ? date.toLocaleDateString('default', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })
      : '';
  }

  isPeriodExpanded(periodId: string): boolean {
    return this.expandedPeriods()[periodId] ?? false;
  }

  togglePeriod(periodId: string): void {
    this.expandedPeriods.update((expanded) => ({
      ...expanded,
      [periodId]: !expanded[periodId],
    }));
  }

  private sortReceipts(receipts: ReceiptDomain[]): ReceiptDomain[] {
    const mode = this.sortMode();
    return [...receipts].sort((first, second) => {
      if (mode === 'amount-asc' || mode === 'amount-desc') {
        const amountDifference =
          this.receiptTotal(first) - this.receiptTotal(second);
        if (amountDifference !== 0) {
          return mode === 'amount-asc' ? amountDifference : -amountDifference;
        }
      }

      const dateDifference =
        (second.date?.getTime() ?? 0) - (first.date?.getTime() ?? 0);
      return mode === 'oldest' ? -dateDifference : dateDifference;
    });
  }
}
