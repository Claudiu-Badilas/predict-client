import { TestBed } from '@angular/core/testing';
import { TransactionsStore } from 'src/app/modules/transaction/stores/transactions.store';
import { describe, expect, it, vi } from 'vitest';
import { TransactionsSettingsComponent } from './transaction-settings.component';
import { expectComponentCreation } from 'src/app/testing/component-test-setup';

describe('TransactionsSettingsComponent', () => {
  it('should create', () => {
    expectComponentCreation(TransactionsSettingsComponent);
  });

  it('accepts supported storage payloads and reloads transaction data', () => {
    expectComponentCreation(TransactionsSettingsComponent, (fixture) => {
      const store = TestBed.inject(TransactionsStore) as unknown as {
        loadTransactions: () => void;
      };
      const reload = vi.spyOn(store, 'loadTransactions');
      const validator = fixture.componentInstance.config.uploadValidator!;

      expect(validator([])).toBe(true);
      expect(validator({ transactions: [] })).toBe(true);
      expect(validator({ Transactions: [] })).toBe(true);
      expect(validator({ economii: [] })).toBe(true);
      expect(validator({ Economii: [] })).toBe(true);
      expect(validator({ transactions: 'not an array' })).toBe(false);
      expect(validator(null)).toBe(false);
      expect(validator(12)).toBe(false);

      fixture.componentInstance.reloadData();
      expect(reload).toHaveBeenCalledOnce();
    });
  });
});
