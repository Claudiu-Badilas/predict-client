import { describe, expect, it } from 'vitest';
import { TransactionFeedComponent } from './transaction-feed.component';
import { expectComponentCreation } from 'src/app/testing/component-test-setup';
import {
  TransactionCategory,
  TransactionDomain,
} from '../../models/transactions.model';

describe('TransactionFeedComponent', () => {
  it('should create', () => {
    expectComponentCreation(TransactionFeedComponent);
  });

  it('paginates entries and derives merchant, date, key, and category data', () => {
    expectComponentCreation(TransactionFeedComponent, (fixture) => {
      const component = fixture.componentInstance;
      const makeTransaction = (values: Partial<TransactionDomain> = {}) =>
        ({
          id: null,
          registrationDate: null,
          completionDate: null,
          serviceProvider: null,
          merchantName: null,
          provider: null,
          description: null,
          category: TransactionCategory.OTHER,
          categoryLabel: 'Other',
          ...values,
        }) as TransactionDomain;
      const many = Array.from({ length: 205 }, (_, index) =>
        makeTransaction({ id: index + 1 }),
      );
      fixture.componentRef.setInput('transactions', many);
      fixture.detectChanges();
      expect(component.visibleTransactions()).toHaveLength(100);
      expect(component.hasMoreTransactions()).toBe(true);
      component.showMore();
      expect(component.visibleTransactions()).toHaveLength(200);
      expect(component.hasMoreTransactions()).toBe(true);
      component.showMore();
      expect(component.visibleTransactions()).toHaveLength(205);
      expect(component.hasMoreTransactions()).toBe(false);

      const transaction = makeTransaction({
        serviceProvider: '  Provider  ',
        merchantName: 'Merchant',
        provider: 'Fallback',
        description: 'A different description',
        category: TransactionCategory.SUPERMARKET,
        categoryLabel: 'Supermarket',
      });
      expect(component.merchantLabel(transaction)).toBe('Provider');
      expect(component.hasDistinctDescription(transaction)).toBe(true);
      expect(component.getCategoryLabel(transaction)).toBe('Supermarket');
      expect(component.getCategoryColor(TransactionCategory.SUPERMARKET)).toBe(
        '#4CAF50',
      );
      expect(component.getCategoryColor('unknown' as TransactionCategory)).toBe(
        '#9E9E9E',
      );
      expect(component.formatDate(new Date(2024, 0, 15))).toContain('2024');
      expect(component.formatDate(null)).toBe('Date unavailable');
      expect(component.transactionKey(makeTransaction({ id: 17 }), 3)).toBe(
        '17',
      );
      expect(
        component.transactionKey(
          makeTransaction({ completionDate: new Date(2024, 0, 2) }),
          3,
        ),
      ).toBe(`${new Date(2024, 0, 2).getTime()}-3`);
      expect(
        component.transactionKey(
          makeTransaction({ registrationDate: new Date(2024, 0, 3) }),
          4,
        ),
      ).toBe(`${new Date(2024, 0, 3).getTime()}-4`);
      expect(component.transactionKey(makeTransaction(), 5)).toBe('0-5');

      expect(
        component.hasDistinctDescription(
          makeTransaction({ description: '  ' }),
        ),
      ).toBe(false);
      expect(
        component.hasDistinctDescription(
          makeTransaction({
            description: ' merchant ',
            merchantName: 'Merchant',
          }),
        ),
      ).toBe(false);
      expect(
        component.hasDistinctDescription(
          makeTransaction({ description: 'details' }),
        ),
      ).toBe(true);
      expect(
        component.merchantLabel(
          makeTransaction({ merchantName: '  Merchant  ' }),
        ),
      ).toBe('Merchant');
      expect(
        component.merchantLabel(makeTransaction({ provider: '  Bank  ' })),
      ).toBe('Bank');
      expect(component.merchantLabel(makeTransaction())).toBe('Transaction');
    });
  });

  it('emits provider selection and highlights escaped case-insensitive search text', () => {
    expectComponentCreation(TransactionFeedComponent, (fixture) => {
      const component = fixture.componentInstance;
      const emitted: string[] = [];
      component.providerSelected.subscribe((provider) =>
        emitted.push(provider),
      );
      const makeTransaction = (values: Record<string, unknown>) =>
        ({
          serviceProvider: null,
          merchantName: null,
          provider: null,
          ...values,
        }) as TransactionDomain;

      component.selectProvider(
        makeTransaction({ serviceProvider: '  Grocery  ' }),
      );
      component.selectProvider(makeTransaction({ merchantName: 'Shop' }));
      component.selectProvider(makeTransaction({ provider: 'Bank' }));
      component.selectProvider(makeTransaction({}));
      expect(emitted).toEqual(['Grocery', 'Shop', 'Bank']);

      expect(component.highlightParts('A.B')).toEqual([
        { text: 'A.B', match: false },
      ]);
      fixture.componentRef.setInput('searchTerm', 'a.b');
      expect(component.highlightParts('A.B and a.b')).toEqual([
        { text: '', match: false },
        { text: 'A.B', match: true },
        { text: ' and ', match: false },
        { text: 'a.b', match: true },
        { text: '', match: false },
      ]);
      fixture.componentRef.setInput('searchTerm', 'a.b');
      expect(component.highlightParts('')).toEqual([
        { text: '', match: false },
      ]);
      fixture.componentRef.setInput('searchTerm', '');
      expect(component.highlightParts('anything')).toEqual([
        { text: 'anything', match: false },
      ]);
    });
  });
});
