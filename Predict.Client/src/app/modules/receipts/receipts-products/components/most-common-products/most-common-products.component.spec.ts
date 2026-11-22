import { describe, expect, it, vi } from 'vitest';
import { ReceiptDomain } from '../../../models/receipts-domain.model';
import { expectComponentCreation } from 'src/app/testing/component-test-setup';
import { MostCommonProductsComponent } from './most-common-products.component';

describe('MostCommonProductsComponent', () => {
  const receipt = (
    id: number,
    provider: string,
    date: string | null,
    totalPrice: number | null,
    products: {
      name: string;
      price: number | null;
      quantity: number | null;
      quantityType?: string;
    }[],
  ) =>
    new ReceiptDomain({
      id,
      provider,
      date,
      totalPrice,
      totalDiscount: 2,
      currency: 'RON',
      products: products.map((product, index) => ({
        id: index + 1,
        receiptId: id,
        name: product.name,
        price: product.price,
        quantity: product.quantity,
        quantityType: product.quantityType ?? 'BUC',
        vat: null as number | null,
      })),
    });

  it('creates', () => {
    expectComponentCreation(MostCommonProductsComponent);
  });

  it('filters and sorts receipt products and builds monthly and yearly groups', () => {
    expectComponentCreation(MostCommonProductsComponent, (fixture) => {
      const component = fixture.componentInstance;
      const newest = receipt(1, ' Lidl ', '2025-03-10', 20, [
        { name: 'Apple', price: 4, quantity: 2 },
        { name: 'Red apple', price: 1, quantity: 1 },
        { name: 'Pear', price: 3, quantity: 1 },
        { name: 'Plum', price: null, quantity: null },
      ]);
      const older = receipt(2, 'Carrefour', '2025-02-10', null, [
        { name: 'Apple', price: 2, quantity: 3 },
        { name: 'Tea.*', price: 5, quantity: 1 },
        { name: 'Plum', price: null, quantity: null },
      ]);
      const undated = receipt(3, '', null, 7, [
        { name: 'Apple', price: 2, quantity: 1 },
      ]);
      const sameTotal = receipt(4, 'Other', '2025-03-10', 20, [
        { name: 'Apple Gala', price: 4, quantity: 2 },
      ]);
      fixture.componentRef.setInput('receipts', [
        newest,
        older,
        undated,
        sameTotal,
      ]);
      fixture.componentRef.setInput('searchTerm', ' ,   ');
      fixture.detectChanges();

      expect(component.filteredReceipts()).toHaveLength(4);
      expect(component.matchingProducts()).toEqual([]);
      expect(component.matchingProductsTotal()).toBe(0);
      expect(component.totalRevenue()).toBe(58);
      expect(component.receiptFrequency()).toBe(4);
      fixture.componentRef.setInput('sortMode', 'amount-asc');
      expect(component.allReceipts().map((item) => item.id)).toEqual([
        3, 2, 1, 4,
      ]);
      fixture.componentRef.setInput('sortMode', 'amount-desc');
      expect(component.allReceipts().map((item) => item.id)).toEqual([
        1, 4, 2, 3,
      ]);
      fixture.componentRef.setInput('sortMode', 'oldest');
      expect(component.allReceipts().map((item) => item.id)).toEqual([
        3, 2, 1, 4,
      ]);
      fixture.componentRef.setInput('sortMode', 'newest');
      expect(component.allReceipts()[0].id).toBe(1);
      expect(component.currentPeriods().map((period) => period.title)).toEqual([
        'Mar 2025',
        'Feb 2025',
      ]);

      fixture.componentRef.setInput('searchTerm', 'apple, tea.*');
      fixture.detectChanges();
      expect(component.matchingProducts()).toHaveLength(6);
      expect(component.matchingProductsTotal()).toBe(30);
      expect(
        component.matchingProductPeriods().map((period) => period.title),
      ).toEqual(['Mar 2025', 'Feb 2025', 'Date unavailable']);
      fixture.componentRef.setInput('searchTerm', 'tea');
      fixture.detectChanges();
      expect(component.highlightParts('Tea drink')).toEqual([
        { text: '', match: false },
        { text: 'Tea', match: true },
        { text: ' drink', match: false },
      ]);
      expect(component.highlightParts('')).toEqual([
        { text: '', match: false },
      ]);
      fixture.componentRef.setInput('searchTerm', 'tea, apple');
      fixture.detectChanges();
      expect(component.highlightParts('Apple tea')).toContainEqual({
        text: 'Apple',
        match: true,
      });
      fixture.componentRef.setInput('searchTerm', 'pear, plum');
      fixture.detectChanges();
      expect(
        component.highlightParts('Plum, pear').some((part) => part.match),
      ).toBe(true);
      fixture.componentRef.setInput('searchTerm', '');
      fixture.detectChanges();
      expect(component.highlightParts('Apple')).toEqual([
        { text: 'Apple', match: false },
      ]);

      fixture.componentRef.setInput('searchTerm', 'apple');
      fixture.componentRef.setInput('sortMode', 'amount-asc');
      expect(component.matchingProducts()[0].product.price).toBe(1);
      fixture.componentRef.setInput('sortMode', 'amount-desc');
      expect(component.matchingProducts()[0].product.price).toBe(4);
      fixture.componentRef.setInput('sortMode', 'oldest');
      expect(component.matchingProducts()[0].receipt.id).toBe(3);
      fixture.componentRef.setInput('sortMode', 'newest');
      expect(component.matchingProducts()[0].receipt.id).toBe(1);

      fixture.componentRef.setInput('searchTerm', 'plum');
      fixture.componentRef.setInput('sortMode', 'amount-asc');
      expect(component.matchingProducts()).toHaveLength(2);
      expect(component.matchingProductsTotal()).toBe(0);
      expect(component.matchingProducts()[0].receipt.id).toBe(1);
      fixture.componentRef.setInput('sortMode', 'amount-desc');
      expect(component.matchingProducts()[0].receipt.id).toBe(1);

      fixture.componentRef.setInput('viewMode', 'yearly');
      expect(component.currentPeriods().map((period) => period.title)).toEqual([
        '2025',
      ]);
      expect(
        component.matchingProductPeriods().map((period) => period.title),
      ).toEqual(['2025']);

      component.selectProvider(' Lidl ');
      expect(component.selectedProvider()).toBe('Lidl');
      expect(component.filteredReceipts().map((item) => item.id)).toEqual([1]);
      expect(component.isProviderSelected(' lidl ')).toBe(true);
      component.selectProvider('lidl');
      expect(component.selectedProvider()).toBeNull();
      component.selectProvider('  ');
      expect(component.selectedProvider()).toBeNull();
      component.selectProvider('Carrefour');
      component.expandedReceiptId.set(2);
      component.selectProvider('Kaufland');
      expect(component.expandedReceiptId()).toBeNull();
      component.clearProviderSelection();
      expect(component.filteredReceipts()).toHaveLength(4);

      expect(component.providerInitial(' lidl ')).toBe('L');
      expect(component.providerInitial('')).toBe('R');
      expect(component.providerInitial(null)).toBe('R');
      expect(component.providerBrand('Lidl Market')).toBe('lidl');
      expect(component.providerBrand('Carrefour Market')).toBe('carrefour');
      expect(component.providerBrand('KAUFLAND')).toBe('kaufland');
      expect(component.providerBrand('Corner Shop')).toBeNull();
      expect(component.providerBrand(null)).toBeNull();
      expect(component.providerHue('Lidl')).toBe(component.providerHue('lidl'));

      expect(component.productSummary(newest)).toBe(
        'Apple, Red apple, Pear +1 more',
      );
      expect(component.productSummary(receipt(4, 'Empty', null, 0, []))).toBe(
        'No item details',
      );
      expect(component.receiptTotal(newest)).toBe(20);
      expect(component.receiptTotal(older)).toBe(11);
      expect(component.formatDay(null)).toBe('');
      expect(component.formatDay(new Date(2025, 2, 10))).toContain('2025');

      component.toggleReceipt(1);
      expect(component.expandedReceiptId()).toBe(1);
      component.toggleReceipt(1);
      expect(component.expandedReceiptId()).toBeNull();
      const selectedProducts: string[] = [];
      component.productSelected.subscribe((name) =>
        selectedProducts.push(name),
      );
      component.selectProduct('Apple');
      expect(selectedProducts).toEqual(['Apple']);

      const periodId = component.currentPeriods()[0].id;
      expect(component.isPeriodExpanded(periodId)).toBe(false);
      component.togglePeriod(periodId);
      expect(component.isPeriodExpanded(periodId)).toBe(true);
      component.togglePeriod(periodId);
      expect(component.isPeriodExpanded(periodId)).toBe(false);
      expect(component.getTotalItems(newest)).toBe(4);
      expect(
        component.getTotalItems(
          receipt(5, 'Bulk', null, 0, [
            { name: 'Rice', price: 3, quantity: 8, quantityType: 'kg' },
          ]),
        ),
      ).toBe(1);
    });
  });

  it('renders grouped receipts and matching-product search states', () => {
    expectComponentCreation(MostCommonProductsComponent, (fixture) => {
      const component = fixture.componentInstance;
      fixture.componentRef.setInput('receipts', [
        receipt(10, 'Lidl', '2025-01-10', null, [
          { name: 'Milk', price: 4, quantity: 2 },
        ]),
        receipt(11, '', null, 0, []),
      ]);
      fixture.detectChanges();
      fixture.nativeElement
        .querySelector('.period-header')
        .dispatchEvent(new Event('click'));
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('Lidl');
      fixture.nativeElement
        .querySelector('.receipt-row__toggle')
        .dispatchEvent(new Event('click'));
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('Milk');
      fixture.nativeElement
        .querySelector('.receipt-product__select')
        .dispatchEvent(new Event('click'));
      fixture.detectChanges();
      expect(component.expandedReceiptId()).toBe(10);
      fixture.nativeElement
        .querySelector('.provider-logo-button')
        .dispatchEvent(new Event('click'));
      fixture.detectChanges();
      expect(component.selectedProvider()).toBe('Lidl');

      fixture.componentRef.setInput('viewMode', 'all');
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('All');
      fixture.componentRef.setInput('viewMode', 'monthly');
      fixture.detectChanges();
      fixture.nativeElement
        .querySelector('.receipt-row__toggle')
        .dispatchEvent(new Event('click'));
      fixture.detectChanges();
      expect(
        fixture.nativeElement.querySelector('.receipt-details'),
      ).toBeTruthy();

      fixture.componentRef.setInput('searchTerm', 'milk');
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('mark')?.textContent).toBe(
        'Milk',
      );
      fixture.componentRef.setInput('viewMode', 'all');
      fixture.detectChanges();
      expect(
        fixture.nativeElement.querySelector('[aria-label="Matching products"]'),
      ).toBeTruthy();
      vi.spyOn(component, 'selectProvider');
      expect(component.providerHue(null)).toBeTypeOf('number');
    });
  });
});
