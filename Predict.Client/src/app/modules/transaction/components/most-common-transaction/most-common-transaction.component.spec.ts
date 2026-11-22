import { describe, expect, it, vi } from 'vitest';
import {
  TransactionCategory,
  TransactionDomain,
} from '../../models/transactions.model';
import { expectComponentCreation } from 'src/app/testing/component-test-setup';
import { MostCommonTransactionComponent } from './most-common-transaction.component';

describe('MostCommonTransactionComponent', () => {
  const transaction = (
    id: number,
    date: string | null,
    amount: number | null,
    overrides: Partial<TransactionDomain> = {},
  ) =>
    new TransactionDomain({
      id,
      registrationDate: date,
      completionDate: null,
      amount,
      fee: null,
      currency: 'RON',
      description: null,
      transactionType: null,
      provider: null,
      referenceId: null,
      identifier: `${id}`,
      account: 'main',
      category: TransactionCategory.OTHER,
      categoryLabel: 'Other',
      serviceProvider: null,
      merchantName: null,
      ...overrides,
    });

  it('creates', () => {
    expectComponentCreation(MostCommonTransactionComponent);
  });

  it('filters, searches, sorts, groups, and emits transaction view changes', () => {
    expectComponentCreation(MostCommonTransactionComponent, (fixture) => {
      vi.stubGlobal(
        'requestAnimationFrame',
        (callback: FrameRequestCallback) => {
          callback(0);
          return 1;
        },
      );
      const component = fixture.componentInstance;
      const scrollContainer = fixture.nativeElement.querySelector(
        '.transactions-scroll',
      ) as HTMLElement;
      scrollContainer.scrollTo = vi.fn();
      const mainTransactions = [
        transaction(1, '2025-03-20', -50, {
          category: TransactionCategory.SUPERMARKET,
          categoryLabel: 'Food',
          serviceProvider: ' Lidl ',
          description: 'Weekly groceries',
        }),
        transaction(2, '2025-03-01', 100, {
          category: TransactionCategory.SALARY,
          categoryLabel: 'Income',
          merchantName: 'Employer',
        }),
        transaction(3, '2025-02-28', -20, {
          category: TransactionCategory.INTERNAL_TRANSFER,
        }),
        transaction(4, null, null, { provider: 'No date' }),
        transaction(5, '2024-12-31', -10, {
          category: TransactionCategory.CAFE_BAKERY,
          categoryLabel: 'Cafe',
          provider: 'Coffee house',
        }),
        transaction(7, '2024-12-30', 10, {
          category: TransactionCategory.OTHER,
          categoryLabel: 'Refund',
          provider: 'Merchant',
        }),
        transaction(10, '2025-03-15', null, {
          category: TransactionCategory.OTHER,
          categoryLabel: 'Unknown',
        }),
      ];
      const savings = transaction(6, '2025-03-05', 5, {
        account: '',
        categoryLabel: 'Savings',
      });
      const emptySavings = transaction(9, '2025-03-06', null, {
        account: '',
        categoryLabel: 'Savings',
      });
      fixture.componentRef.setInput('transactions', mainTransactions);
      fixture.componentRef.setInput('economiiTransactions', [
        savings,
        emptySavings,
      ]);
      fixture.detectChanges();

      expect(component.accountOptions().map((option) => option.label)).toEqual([
        'Main',
        'Economii',
      ]);
      expect(component.activeAccount()?.key).toBe('main');
      expect(component.selectedTransaction()).toHaveLength(7);
      expect(component.filteredTransactions()).toHaveLength(6);
      expect(component.totalIncome()).toBe(110);
      expect(component.totalExpense()).toBe(60);
      expect(component.totalTransactions()).toBe(6);
      expect(component.allTransactions()[0].id).toBe(1);
      expect(component.currentPeriods().map((period) => period.title)).toEqual([
        'Mar 2025',
        'Dec 2024',
      ]);
      expect(component.currentPeriods()[0]).toMatchObject({
        totalIncome: 100,
        totalExpense: 50,
        difference: 50,
        transactionCount: 3,
      });
      const march = component.currentPeriods()[0];
      component.togglePeriod(march);
      expect(component.currentPeriods()[0].isExpanded).toBe(true);
      component.togglePeriod(component.currentPeriods()[1]);
      expect(component.currentPeriods()[0].isExpanded).toBe(false);
      component.togglePeriod(component.currentPeriods()[1]);
      expect(component.currentPeriods()[1].isExpanded).toBe(false);
      expect(component.formatDay(null)).toBe('');
      expect(component.formatDay(new Date(2025, 2, 20))).toContain('20');

      component.selectCategory(TransactionCategory.SUPERMARKET);
      expect(component.filteredTransactions().map((tx) => tx.id)).toEqual([1]);
      expect(component.selectedCategoryLabel()).toBe('Food');
      component.selectCategory(TransactionCategory.SUPERMARKET);
      expect(component.selectedCategory()).toBeNull();
      component.selectProvider('lidl');
      expect(component.filteredTransactions().map((tx) => tx.id)).toEqual([1]);
      component.selectProvider('LIDL');
      expect(component.selectedProvider()).toBeNull();
      component.selectProvider('coffee house');
      expect(component.filteredTransactions().map((tx) => tx.id)).toEqual([5]);
      component.selectProvider('employer');
      expect(component.filteredTransactions().map((tx) => tx.id)).toEqual([2]);
      component.clearTransactionFilter();
      expect(component.filteredTransactions()).toHaveLength(6);

      component.onSearchInput({
        target: { value: 'GROCERIES' },
      } as unknown as Event);
      expect(component.searchTerm()).toBe('GROCERIES');
      expect(component.selectedTransaction().map((tx) => tx.id)).toEqual([1]);
      component.onSearchInput({
        target: { value: 'not found' },
      } as unknown as Event);
      expect(component.selectedTransaction()).toEqual([]);
      component.clearSearch();
      expect(component.searchTerm()).toBe('');

      component.toggleDateSort();
      expect(component.sortMode()).toBe('oldest');
      component.toggleDateSort();
      expect(component.sortMode()).toBe('recent');
      component.toggleAmountSort();
      expect(component.sortMode()).toBe('amount-desc');
      component.toggleAmountSort();
      expect(component.sortMode()).toBe('amount-asc');
      expect(component.allTransactions()[0].amount).toBeNull();

      const viewModes: string[] = [];
      component.viewModeChange.subscribe((value) => viewModes.push(value));
      component.setViewMode('yearly');
      component.setViewModeFromToggle('all');
      component.setViewModeFromToggle('monthly');
      component.setViewModeFromToggle('yearly');
      component.setViewModeFromToggle('invalid');
      expect(viewModes).toEqual(['yearly', 'all', 'monthly', 'yearly']);
      fixture.componentRef.setInput('viewMode', 'yearly');
      fixture.detectChanges();
      expect(component.currentPeriods().map((period) => period.title)).toEqual([
        '2025',
        '2024',
      ]);
      fixture.componentRef.setInput('viewMode', 'all');
      fixture.detectChanges();
      expect(component.currentPeriods()).toEqual([]);
      fixture.componentRef.setInput('viewMode', 'yearly');
      fixture.detectChanges();

      const ranges: unknown[] = [];
      component.dateRangeChange.subscribe((range) => ranges.push(range));
      const range = {
        fromDate: new Date(2025, 0, 1),
        toDate: new Date(2025, 1, 1),
      };
      component.onDateRangeChange(range as never);
      expect(ranges).toEqual([range]);

      const datasets: string[] = [];
      component.datasetChanged.subscribe((value) => datasets.push(value));
      component.searchTerm.set('keep?');
      component.selectedProvider.set('Lidl');
      component.setDataset('missing');
      expect(datasets).toEqual([]);
      component.setDataset('Economii');
      expect(datasets).toEqual(['economii']);
      expect(component.showEconomii()).toBe(true);
      expect(component.selectedTransaction().map((tx) => tx.id)).toEqual([
        6, 9,
      ]);
      expect(component.economiiTotal()).toBe(5);
      expect(component.searchTerm()).toBe('');
      expect(component.selectedProvider()).toBeNull();

      component.excludeInternalTransactions.set(false);
      component.selectedAccount.set('unknown');
      expect(component.activeAccount()?.key).toBe('main');
      expect(component.filteredTransactions().map((tx) => tx.id)).toContain(3);
      fixture.componentRef.setInput('viewMode', 'monthly');
      fixture.detectChanges();
      expect(component.currentPeriods().map((period) => period.title)).toEqual([
        'Mar 2025',
        'Feb 2025',
        'Dec 2024',
      ]);

      fixture.componentRef.setInput('transactions', [
        transaction(7, '2025-01-01', 1, { account: 'zeta' }),
        transaction(8, '2025-01-02', 2, { account: 'alpha' }),
      ]);
      fixture.componentRef.setInput('economiiTransactions', []);
      fixture.detectChanges();
      expect(component.accountOptions().map((option) => option.label)).toEqual([
        'alpha',
        'zeta',
      ]);
      expect(component.activeAccount()?.key).toBe('alpha');
      component.selectedAccount.set('missing');
      expect(component.activeAccount()?.key).toBe('alpha');
      fixture.componentRef.setInput('transactions', []);
      fixture.detectChanges();
      expect(component.activeAccount()).toBeNull();
      fixture.componentRef.setInput('viewMode', 'monthly');
      fixture.detectChanges();
      expect(component.currentPeriods()).toEqual([]);
      expect(scrollContainer.scrollTo).toHaveBeenCalled();
    });
  });
});
