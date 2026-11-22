import { describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Overlay } from '@angular/cdk/overlay';
import { TransactionInsightsComponent } from './transaction-insights.component';
import { expectComponentCreation } from 'src/app/testing/component-test-setup';
import {
  TransactionCategory,
  TransactionDomain,
} from '../../models/transactions.model';

describe('TransactionInsightsComponent', () => {
  it('should create', () => {
    expectComponentCreation(TransactionInsightsComponent);
  });

  it('builds six monthly summaries with income, spending, categories, and merchants', () => {
    expectComponentCreation(TransactionInsightsComponent, (fixture) => {
      vi.useFakeTimers();
      try {
        vi.setSystemTime(new Date(2025, 5, 10));
        const transaction = (
          overrides: Partial<TransactionDomain>,
        ): TransactionDomain =>
          ({
            id: null,
            registrationDate: null,
            completionDate: null,
            amount: null,
            currency: ' USD ',
            category: TransactionCategory.OTHER,
            categoryLabel: 'Other',
            serviceProvider: null,
            merchantName: null,
            provider: null,
            ...overrides,
          }) as TransactionDomain;
        fixture.componentRef.setInput('transactions', [
          transaction({
            completionDate: new Date(2025, 4, 15),
            amount: -80,
            category: TransactionCategory.SUPERMARKET,
            categoryLabel: 'Food',
            serviceProvider: '  ',
            merchantName: 'Market',
          }),
          transaction({
            registrationDate: new Date(2025, 4, 20),
            amount: -20,
            categoryLabel: '  ',
            provider: 'Corner shop',
          }),
          transaction({
            registrationDate: new Date(2025, 4, 22),
            amount: 200,
          }),
          transaction({
            registrationDate: new Date(2025, 4, 25),
            amount: 0,
          }),
          transaction({
            registrationDate: new Date(2025, 4, 27),
            amount: -30,
            category: TransactionCategory.SHOPPING,
            categoryLabel: 'Shopping',
            serviceProvider: 'Storefront',
          }),
          transaction({
            registrationDate: new Date(2025, 4, 28),
            amount: -5,
            category: TransactionCategory.SUPERMARKET,
            categoryLabel: 'Food',
          }),
          transaction({
            registrationDate: new Date(2025, 4, 29),
            amount: null,
            categoryLabel: 'Unknown',
          }),
          transaction({
            registrationDate: new Date(2025, 4, 26),
            amount: -1000,
            category: TransactionCategory.INTERNAL_TRANSFER,
          }),
          transaction({ amount: -5 }),
          transaction({
            completionDate: new Date(2025, 3, 15),
            amount: -55,
            categoryLabel: 'Dining',
            provider: 'Cafe',
          }),
          transaction({
            completionDate: new Date(2025, 2, 15),
            amount: -70,
            categoryLabel: 'Dining',
            serviceProvider: 'Service Store',
          }),
          transaction({
            completionDate: new Date(2025, 1, 15),
            amount: -90,
            categoryLabel: 'Other',
          }),
        ]);
        fixture.detectChanges();

        const stories = fixture.componentInstance.insightStories();
        expect(stories).toHaveLength(6);
        expect(stories[0].title).toContain('Your money in May 2025');
        expect(stories[0].value).toContain('135,00 USD');
        expect(stories[0].income).toContain('200,00 USD');
        expect(stories[0].balance).toContain('+65,00 USD');
        expect(stories[0].transactionCount).toBe(7);
        expect(stories[0].topCategories?.[0]).toContain('Food');
        expect(stories[0].largestPurchase).toContain('at Market');
        expect(stories[0].comparison).toContain('68% of last month');
        expect(stories[1].title).toContain('Your money in April 2025');
        expect(stories[1].largestPurchase).toContain('at Cafe');
        expect(stories[2].largestPurchase).toContain('at Service Store');
        expect(stories[3].largestPurchase).not.toContain(' at ');

        fixture.componentRef.setInput('showEconomii', true);
        fixture.componentRef.setInput('economiiTransactions', [
          transaction({
            registrationDate: new Date(2025, 4, 4),
            amount: 50,
          }),
        ]);
        fixture.detectChanges();
        expect(fixture.componentInstance.insightStories()[0].title).toContain(
          'Savings activity',
        );

        fixture.componentRef.setInput('showEconomii', false);
        fixture.componentRef.setInput('transactions', []);
        fixture.detectChanges();
        const emptyStory = fixture.componentInstance.insightStories()[0];
        expect(emptyStory.value).toContain('0,00 RON');
        expect(emptyStory.comparison).toBe('No income recorded last month');
        expect(emptyStory.largestPurchase).toBeUndefined();
      } finally {
        vi.useRealTimers();
      }
    });
  });

  it('controls story overlays, navigation, pause timing, and keyboard actions', () => {
    expectComponentCreation(TransactionInsightsComponent, (fixture) => {
      vi.useFakeTimers();
      try {
        const component = fixture.componentInstance;
        const overlay = TestBed.inject(Overlay) as unknown as {
          create: { mock: { results: { value: unknown }[] } };
        };
        component.handleStoryKeyboard(
          new KeyboardEvent('keydown', { key: 'ArrowRight' }),
        );
        expect(component.showInsights()).toBe(false);
        component.pauseStory(new PointerEvent('pointerdown', { button: 0 }));
        component.resumeStory();
        component.openInsights();
        expect(component.showInsights()).toBe(true);
        expect(component.insightStories()).toHaveLength(6);
        const overlayRef = overlay.create.mock.results[0].value as {
          hasAttached: ReturnType<typeof vi.fn>;
          dispose: ReturnType<typeof vi.fn>;
        };
        overlayRef.hasAttached.mockReturnValue(true);
        component.openInsights();
        expect(overlay.create.mock.results).toHaveLength(1);
        overlayRef.hasAttached.mockReturnValue(false);

        component.previousStory();
        component.pauseStory(new PointerEvent('pointerdown', { button: 1 }));
        component.previousStory(true);
        expect(component.activeStory()).toBe(0);
        const performanceNow = vi.spyOn(performance, 'now').mockReturnValue(0);
        component.pauseStory(new PointerEvent('pointerdown', { button: 1 }));
        component.pauseStory(new PointerEvent('pointerdown', { button: 0 }));
        expect(component.isStoryPaused()).toBe(true);
        vi.advanceTimersByTime(300);
        performanceNow.mockReturnValue(300);
        component.resumeStory();
        performanceNow.mockRestore();
        component.nextStory(true);
        expect(component.activeStory()).toBe(0);
        component.nextStory(true);
        expect(component.activeStory()).toBe(1);
        const performanceNowAgain = vi
          .spyOn(performance, 'now')
          .mockReturnValue(400);
        component.pauseStory(new PointerEvent('pointerdown', { button: 0 }));
        vi.advanceTimersByTime(300);
        performanceNowAgain.mockReturnValue(700);
        component.resumeStory();
        component.previousStory(true);
        expect(component.activeStory()).toBe(1);
        component.previousStory(true);
        expect(component.activeStory()).toBe(0);
        performanceNowAgain.mockRestore();
        component.handleStoryKeyboard(
          new KeyboardEvent('keydown', { key: 'ArrowRight' }),
        );
        expect(component.activeStory()).toBe(1);
        component.handleStoryKeyboard(
          new KeyboardEvent('keydown', { key: 'ArrowLeft' }),
        );
        expect(component.activeStory()).toBe(0);
        component.nextStory();
        component.nextStory();
        component.nextStory();
        component.nextStory();
        component.nextStory();
        expect(component.activeStory()).toBe(5);
        component.nextStory();
        expect(component.showInsights()).toBe(false);
        expect(overlayRef.dispose).toHaveBeenCalled();

        component.openInsights();
        component.handleStoryKeyboard(
          new KeyboardEvent('keydown', { key: 'Escape' }),
        );
        expect(component.showInsights()).toBe(false);
        component.openInsights();
        vi.advanceTimersByTime(5000);
        expect(component.activeStory()).toBe(1);
        expect(component.showInsights()).toBe(true);
        component.closeInsights();
        component.openInsights();
        component.ngOnDestroy();
        vi.advanceTimersByTime(5000);
        expect(component.activeStory()).toBe(0);
      } finally {
        vi.useRealTimers();
      }
    });
  });
});
