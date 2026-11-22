import { CommonModule } from '@angular/common';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  OnDestroy,
  TemplateRef,
  ViewContainerRef,
  signal,
  viewChild,
} from '@angular/core';
import { ReceiptDomain } from '../../models/receipts-domain.model';

interface ReceiptInsight {
  eyebrow: string;
  title: string;
  value: string;
  receiptCount: number;
  average: string;
  comparison: string;
  largestReceipt?: string;
  topStore?: string;
  topProduct?: string;
  discounts: string;
}

@Component({
  selector: 'p-receipt-insights',
  imports: [CommonModule],
  templateUrl: './receipt-insights.component.html',
  styleUrl: './receipt-insights.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown)': 'handleStoryKeyboard($event)' },
})
export class ReceiptInsightsComponent implements OnDestroy {
  private readonly overlay = inject(Overlay);
  private readonly viewContainerRef = inject(ViewContainerRef);
  private readonly storyOverlay =
    viewChild.required<TemplateRef<unknown>>('storyOverlay');

  receipts = input<ReceiptDomain[]>([]);
  startDate = input.required<Date>();
  endDate = input.required<Date>();

  showInsights = signal(false);
  activeStory = signal(0);
  isStoryPaused = signal(false);
  insightStories = computed(() => this.createInsightStories(this.receipts()));
  private storyTimer: ReturnType<typeof setTimeout> | null = null;
  private overlayRef: OverlayRef | null = null;
  private storyTimerDeadline = 0;
  private remainingStoryTime = 5000;
  private pointerHoldStartedAt = 0;
  private suppressStoryTap = false;

  openInsights(): void {
    if (this.overlayRef?.hasAttached()) return;
    this.activeStory.set(0);
    this.suppressStoryTap = false;
    this.showInsights.set(true);
    this.overlayRef = this.overlay.create({
      positionStrategy: this.overlay
        .position()
        .global()
        .top('0')
        .left('0')
        .width('100vw')
        .height('100dvh'),
      scrollStrategy: this.overlay.scrollStrategies.block(),
      panelClass: 'receipt-insights-overlay-pane',
    });
    this.overlayRef.attach(
      new TemplatePortal(this.storyOverlay(), this.viewContainerRef),
    );
    this.scheduleNextStory();
  }

  closeInsights(): void {
    this.clearStoryTimer();
    this.isStoryPaused.set(false);
    this.suppressStoryTap = false;
    this.showInsights.set(false);
    this.overlayRef?.dispose();
    this.overlayRef = null;
  }

  previousStory(fromTap = false): void {
    if (fromTap && this.consumeSuppressedTap()) return;
    if (this.activeStory() === 0) return;
    this.activeStory.update((index) => index - 1);
    this.scheduleNextStory();
  }

  nextStory(fromTap = false): void {
    if (fromTap && this.consumeSuppressedTap()) return;
    if (this.activeStory() >= this.insightStories().length - 1) {
      this.closeInsights();
      return;
    }
    this.activeStory.update((index) => index + 1);
    this.scheduleNextStory();
  }

  pauseStory(event: PointerEvent): void {
    if (
      !this.showInsights() ||
      this.storyTimer === null ||
      event.button !== 0
    ) {
      return;
    }

    this.suppressStoryTap = false;
    this.pointerHoldStartedAt = performance.now();
    this.remainingStoryTime = Math.max(0, this.storyTimerDeadline - Date.now());
    this.clearStoryTimer();
    this.isStoryPaused.set(true);
  }

  resumeStory(cancelled = false): void {
    if (!this.isStoryPaused()) return;
    this.suppressStoryTap =
      !cancelled && performance.now() - this.pointerHoldStartedAt >= 250;
    this.isStoryPaused.set(false);
    this.startStoryTimer();
  }

  ngOnDestroy(): void {
    this.clearStoryTimer();
    this.overlayRef?.dispose();
  }

  handleStoryKeyboard(event: KeyboardEvent): void {
    if (!this.showInsights()) return;
    if (event.key === 'Escape') this.closeInsights();
    if (event.key === 'ArrowLeft') this.previousStory();
    if (event.key === 'ArrowRight') this.nextStory();
  }

  private scheduleNextStory(): void {
    this.clearStoryTimer();
    this.remainingStoryTime = 5000;
    this.startStoryTimer();
  }

  private startStoryTimer(): void {
    this.storyTimerDeadline = Date.now() + this.remainingStoryTime;
    this.storyTimer = setTimeout(() => {
      this.storyTimer = null;
      this.nextStory();
    }, this.remainingStoryTime);
  }

  private consumeSuppressedTap(): boolean {
    if (!this.suppressStoryTap) return false;
    this.suppressStoryTap = false;
    return true;
  }

  private clearStoryTimer(): void {
    if (this.storyTimer === null) return;
    clearTimeout(this.storyTimer);
    this.storyTimer = null;
  }

  private createInsightStories(receipts: ReceiptDomain[]): ReceiptInsight[] {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(
      currentMonthStart.getFullYear(),
      currentMonthStart.getMonth() - 1,
      1,
    );
    const currency =
      receipts.find((receipt) => receipt.currency?.trim())?.currency.trim() ||
      'RON';
    const formatAmount = (amount: number) =>
      `${new Intl.NumberFormat('ro-RO', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount)} ${currency}`;

    const months = Array.from(
      { length: 6 },
      (_, index) =>
        new Date(
          lastMonthStart.getFullYear(),
          lastMonthStart.getMonth() - index,
          1,
        ),
    );
    const monthlyReceipts = months.map((monthStart) => {
      const nextMonth = new Date(
        monthStart.getFullYear(),
        monthStart.getMonth() + 1,
        1,
      );
      const monthReceipts = receipts.filter(
        (receipt) =>
          receipt.date !== null &&
          receipt.date >= monthStart &&
          receipt.date < nextMonth,
      );
      const total = monthReceipts.reduce(
        (sum, receipt) => sum + this.receiptTotal(receipt),
        0,
      );
      const providers = new Map<string, number>();
      const products = new Map<string, number>();
      for (const receipt of monthReceipts) {
        const provider = receipt.provider?.trim() || 'Unknown store';
        providers.set(
          provider,
          (providers.get(provider) ?? 0) + this.receiptTotal(receipt),
        );
        for (const product of receipt.products) {
          const name = product.name?.trim();
          if (name) {
            products.set(
              name,
              (products.get(name) ?? 0) +
                (product.price ?? 0) * (product.quantity ?? 0),
            );
          }
        }
      }
      const largest = monthReceipts.reduce<ReceiptDomain | null>(
        (current, receipt) =>
          !current || this.receiptTotal(receipt) > this.receiptTotal(current)
            ? receipt
            : current,
        null,
      );
      const topProvider = Array.from(providers.entries()).sort(
        (a, b) => b[1] - a[1],
      )[0];
      const topProduct = Array.from(products.entries()).sort(
        (a, b) => b[1] - a[1],
      )[0];
      const discounts = monthReceipts.reduce(
        (sum, receipt) => sum + (receipt.totalDiscount ?? 0),
        0,
      );
      return {
        monthStart,
        monthReceipts,
        total,
        largest,
        topProvider,
        topProduct,
        discounts,
      };
    });
    const lastMonthSpend = monthlyReceipts[0].total;
    return monthlyReceipts.map(
      ({
        monthStart,
        monthReceipts,
        total,
        largest,
        topProvider,
        topProduct,
        discounts,
      }) => {
        const monthLabel = monthStart.toLocaleDateString('en-US', {
          month: 'long',
          year: 'numeric',
        });
        const comparison =
          lastMonthSpend > 0
            ? `${Math.round((total / lastMonthSpend) * 100)}% of last month's receipt spending (${formatAmount(lastMonthSpend)})`
            : 'No receipt spending recorded last month';
        return {
          eyebrow: `Six-month story · ${monthLabel}`,
          title: `Your receipts in ${monthLabel}`,
          value: formatAmount(total),
          receiptCount: monthReceipts.length,
          average: formatAmount(
            monthReceipts.length ? total / monthReceipts.length : 0,
          ),
          comparison,
          largestReceipt: largest
            ? `${formatAmount(this.receiptTotal(largest))} at ${largest.provider?.trim() || 'Unknown store'} on ${largest.date!.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
            : undefined,
          topStore: topProvider
            ? `${topProvider[0]} · ${formatAmount(topProvider[1])}`
            : undefined,
          topProduct: topProduct
            ? `${topProduct[0]} · ${formatAmount(topProduct[1])}`
            : undefined,
          discounts: formatAmount(discounts),
        };
      },
    );
  }

  private receiptTotal(receipt: ReceiptDomain): number {
    if (receipt.totalPrice !== null && receipt.totalPrice !== undefined) {
      return receipt.totalPrice;
    }
    return receipt.products.reduce(
      (sum, product) => sum + (product.price ?? 0) * (product.quantity ?? 0),
      0,
    );
  }
}
