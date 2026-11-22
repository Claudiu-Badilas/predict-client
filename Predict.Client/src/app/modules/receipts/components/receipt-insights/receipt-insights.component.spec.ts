import { describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Overlay } from '@angular/cdk/overlay';
import { ReceiptInsightsComponent } from './receipt-insights.component';
import { expectComponentCreation } from 'src/app/testing/component-test-setup';
import { ReceiptDomain } from '../../models/receipts-domain.model';

describe('ReceiptInsightsComponent', () => {
  it('should create', () => {
    expectComponentCreation(ReceiptInsightsComponent);
  });

  it('summarizes receipt totals, discounts, stores, and products by month', () => {
    expectComponentCreation(ReceiptInsightsComponent, (fixture) => {
      vi.useFakeTimers();
      try {
        vi.setSystemTime(new Date(2025, 5, 10));
        const receipt = (
          id: number,
          date: string | null,
          totalPrice: number | null,
          totalDiscount: number | null,
          provider: string,
          products: {
            name: string;
            price: number | null;
            quantity: number | null;
          }[],
        ) =>
          new ReceiptDomain({
            id,
            date,
            totalPrice,
            totalDiscount,
            currency: ' USD ',
            provider,
            products: products.map((product, index) => ({
              id: index + 1,
              name: product.name,
              price: product.price,
              vat: 0 as number | null,
              quantity: product.quantity,
              quantityType: 'item',
              receiptId: id,
            })),
          });
        fixture.componentRef.setInput('receipts', [
          receipt(1, '2025-05-15', 100, 10, ' Market A ', [
            { name: 'Apples', price: 10, quantity: 2 },
            { name: 'Milk', price: 20, quantity: 1 },
          ]),
          receipt(2, '2025-05-20', null, null, ' ', [
            { name: ' Apples ', price: 10, quantity: 1 },
            { name: ' ', price: 5, quantity: 1 },
            { name: 'Unknown amount', price: null, quantity: null },
          ]),
          receipt(3, null, 500, 0, 'No date', []),
          receipt(4, '2025-04-12', 50, 5, '', []),
        ]);
        fixture.detectChanges();

        const stories = fixture.componentInstance.insightStories();
        expect(stories).toHaveLength(6);
        expect(stories[0].title).toContain('Your receipts in May 2025');
        expect(stories[0].value).toContain('115,00 USD');
        expect(stories[0].receiptCount).toBe(2);
        expect(stories[0].average).toContain('57,50 USD');
        expect(stories[0].comparison).toContain(
          "100% of last month's receipt spending",
        );
        expect(stories[0].largestReceipt).toContain('100,00 USD at Market A');
        expect(stories[0].topStore).toContain('Market A');
        expect(stories[0].topProduct).toContain('Apples');
        expect(stories[0].discounts).toContain('10,00 USD');
        expect(stories[1].title).toContain('April 2025');
        expect(stories[1].largestReceipt).toContain('Unknown store');

        fixture.componentRef.setInput('receipts', []);
        fixture.detectChanges();
        const emptyStory = fixture.componentInstance.insightStories()[0];
        expect(emptyStory.value).toContain('0,00 RON');
        expect(emptyStory.receiptCount).toBe(0);
        expect(emptyStory.average).toContain('0,00 RON');
        expect(emptyStory.comparison).toBe(
          'No receipt spending recorded last month',
        );
        expect(emptyStory.largestReceipt).toBeUndefined();
        expect(emptyStory.topStore).toBeUndefined();
        expect(emptyStory.topProduct).toBeUndefined();
      } finally {
        vi.useRealTimers();
      }
    });
  });

  it('controls the receipt story overlay and advances through its stories', () => {
    expectComponentCreation(ReceiptInsightsComponent, (fixture) => {
      vi.useFakeTimers();
      try {
        const component = fixture.componentInstance;
        const overlay = TestBed.inject(Overlay) as unknown as {
          create: { mock: { results: { value: unknown }[] } };
        };
        component.handleStoryKeyboard(
          new KeyboardEvent('keydown', { key: 'Escape' }),
        );
        component.previousStory();
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
        expect(component.activeStory()).toBe(0);
        component.pauseStory(new PointerEvent('pointerdown', { button: 1 }));
        const performanceNow = vi.spyOn(performance, 'now').mockReturnValue(0);
        component.pauseStory(new PointerEvent('pointerdown', { button: 0 }));
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
        component.nextStory();
        expect(component.showInsights()).toBe(false);
        expect(overlayRef.dispose).toHaveBeenCalled();

        component.openInsights();
        vi.advanceTimersByTime(5000);
        expect(component.activeStory()).toBe(1);
        component.closeInsights();
        component.openInsights();
        component.handleStoryKeyboard(
          new KeyboardEvent('keydown', { key: 'Escape' }),
        );
        expect(component.showInsights()).toBe(false);
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
