import { TestBed } from '@angular/core/testing';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TransactionsStore } from 'src/app/modules/transaction/stores/transactions.store';
import { describe, expect, it, vi } from 'vitest';
import { TransactionComponent } from './transaction.component';
import { expectComponentCreation } from 'src/app/testing/component-test-setup';

describe('TransactionComponent', () => {
  it('should create', () => {
    expectComponentCreation(TransactionComponent);
  });

  it('filters transaction insights by the selected account and forwards actions', () => {
    expectComponentCreation(TransactionComponent, (fixture) => {
      const store = TestBed.inject(TransactionsStore) as unknown as {
        transactions: { set(value: { account: string | null }[]): void };
        economii: { set(value: { account: string | null }[]): void };
        setDateRange: (start: Date, end: Date) => void;
        setViewMode: (mode: 'all' | 'monthly' | 'yearly') => void;
      };
      const modal = TestBed.inject(NgbModal);
      const setRange = vi.spyOn(store, 'setDateRange');
      const setView = vi.spyOn(store, 'setViewMode');
      const open = vi.spyOn(modal, 'open');
      const component = fixture.componentInstance;

      store.transactions.set([
        { account: ' Zulu ' },
        { account: ' MAIN ' },
        { account: null },
      ]);
      store.economii.set([
        { account: 'Economii' },
        { account: ' Alpha ' },
        { account: null },
      ]);
      expect(component.accountOptions()).toEqual([
        'main',
        'economii',
        'alpha',
        'zulu',
      ]);
      expect(component.activeAccount()).toBe('main');
      expect(component.showEconomiiInsights()).toBe(false);
      expect(component.insightTransactions()).toHaveLength(2);
      expect(component.insightEconomii()).toEqual([]);

      component.setInsightsDataset('ECONOMII');
      expect(component.activeAccount()).toBe('economii');
      expect(component.showEconomiiInsights()).toBe(true);
      expect(component.insightTransactions()).toEqual([]);
      expect(component.insightEconomii()).toHaveLength(2);

      component.setInsightsDataset('zulu');
      expect(component.insightTransactions()).toHaveLength(1);
      component.setInsightsDataset('unknown');
      expect(component.activeAccount()).toBe('main');

      const start = new Date(2024, 0, 1);
      const end = new Date(2024, 0, 31);
      component.handleRangeChange({ startDate: start, endDate: end });
      component.onViewModeChange('yearly');
      component.openStorageSettings();
      expect(setRange).toHaveBeenCalledWith(start, end);
      expect(setView).toHaveBeenCalledWith('yearly');
      expect(open).toHaveBeenCalledWith(expect.any(Function), {
        centered: true,
        size: 'lg',
        scrollable: true,
      });
    });
  });
});
