import { TestBed } from '@angular/core/testing';
import { ReceiptsStore } from 'src/app/modules/receipts/stores/receipts.store';
import { describe, expect, it, vi } from 'vitest';
import { ReceiptsComponent } from './receipts.component';
import { expectComponentCreation } from 'src/app/testing/component-test-setup';

describe('ReceiptsComponent', () => {
  it('should create', () => {
    expectComponentCreation(ReceiptsComponent);
  });

  it('maps view labels, forwards filters, and toggles sort modes', () => {
    expectComponentCreation(ReceiptsComponent, (fixture) => {
      const store = TestBed.inject(ReceiptsStore) as unknown as {
        receiptsView: {
          viewMode: { set(value: 'all' | 'monthly' | 'yearly'): void };
        };
        setReceiptsViewMode: (value: string) => void;
        setDateRange: (start: Date, end: Date) => void;
        setSearchTerm: (value: string) => void;
      };
      const setView = vi.spyOn(store, 'setReceiptsViewMode');
      const setRange = vi.spyOn(store, 'setDateRange');
      const setSearch = vi.spyOn(store, 'setSearchTerm');
      const component = fixture.componentInstance;

      expect(component.selectedViewLabel()).toBe('All');
      store.receiptsView.viewMode.set('yearly');
      expect(component.selectedViewLabel()).toBe('Yearly');
      store.receiptsView.viewMode.set('monthly');
      expect(component.selectedViewLabel()).toBe('Monthly');

      component.onToggle('YEARLY');
      component.onToggle('All');
      expect(setView).toHaveBeenNthCalledWith(1, 'yearly');
      expect(setView).toHaveBeenNthCalledWith(2, 'all');

      component.toggleDateSort();
      expect(component.receiptSortMode()).toBe('oldest');
      component.toggleDateSort();
      expect(component.receiptSortMode()).toBe('newest');
      component.toggleAmountSort();
      expect(component.receiptSortMode()).toBe('amount-desc');
      component.toggleAmountSort();
      expect(component.receiptSortMode()).toBe('amount-asc');

      const startDate = new Date(2024, 0, 1);
      const endDate = new Date(2024, 11, 31);
      component.handleRangeChange({ startDate, endDate });
      component.onSearch('market');
      expect(setRange).toHaveBeenCalledWith(startDate, endDate);
      expect(setSearch).toHaveBeenCalledWith('market');
    });
  });
});
