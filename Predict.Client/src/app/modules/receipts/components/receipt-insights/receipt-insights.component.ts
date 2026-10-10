import { CommonModule } from '@angular/common';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  HostListener,
  inject,
  input,
  OnDestroy,
  TemplateRef,
  ViewChild,
  ViewContainerRef,
  signal,
} from '@angular/core';
import { ReceiptDomain } from '../../models/receipts-domain.model';

interface ReceiptInsight {
  eyebrow: string;
  title: string;
  value: string;
  detail: string;
  monthlySpend?: { label: string; amount: string; barWidth: number }[];
}

@Component({
  selector: 'p-receipt-insights',
  imports: [CommonModule],
  templateUrl: './receipt-insights.component.html',
  styleUrl: './receipt-insights.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReceiptInsightsComponent implements OnDestroy {
  private readonly overlay = inject(Overlay);
  private readonly viewContainerRef = inject(ViewContainerRef);
  @ViewChild('storyOverlay', { static: true })
  private storyOverlay!: TemplateRef<unknown>;

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
      new TemplatePortal(this.storyOverlay, this.viewContainerRef),
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

  @HostListener('document:keydown', ['$event'])
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
    const sixMonthStart = new Date(
      lastMonthStart.getFullYear(),
      lastMonthStart.getMonth() - 5,
      1,
    );
    const lastMonthLabel = lastMonthStart.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
    const lastMonthReceipts = receipts.filter(
      (receipt) =>
        receipt.date !== null &&
        receipt.date >= lastMonthStart &&
        receipt.date < currentMonthStart,
    );
    const currency =
      receipts.find((receipt) => receipt.currency?.trim())?.currency.trim() ||
      'RON';
    const formatAmount = (amount: number) =>
      `${new Intl.NumberFormat('ro-RO', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount)} ${currency}`;

    const selectedStartMonth = new Date(
      this.startDate().getFullYear(),
      this.startDate().getMonth(),
      1,
    );
    const selectedEndMonth = new Date(
      this.endDate().getFullYear(),
      this.endDate().getMonth(),
      1,
    );
    const comparisonStart = new Date(
      Math.max(sixMonthStart.getTime(), selectedStartMonth.getTime()),
    );
    const comparisonEnd =
      selectedEndMonth < currentMonthStart
        ? new Date(
            selectedEndMonth.getFullYear(),
            selectedEndMonth.getMonth() + 1,
            1,
          )
        : currentMonthStart;
    const monthlySpend: {
      label: string;
      amount: string;
      total: number;
      barWidth: number;
    }[] = [];

    for (
      let monthStart = comparisonStart;
      monthStart < comparisonEnd;
      monthStart = new Date(
        monthStart.getFullYear(),
        monthStart.getMonth() + 1,
        1,
      )
    ) {
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
      monthlySpend.push({
        label: monthStart.toLocaleDateString('en-US', {
          month: 'short',
          year: '2-digit',
        }),
        amount: formatAmount(total),
        total,
        barWidth: 0,
      });
    }

    const maxMonthlySpend = Math.max(
      0,
      ...monthlySpend.map((month) => month.total),
    );
    for (const month of monthlySpend) {
      month.barWidth =
        maxMonthlySpend > 0 ? (month.total / maxMonthlySpend) * 100 : 0;
    }

    const stories: ReceiptInsight[] = [];
    if (!lastMonthReceipts.length) {
      stories.push({
        eyebrow: 'Last month',
        title: `No receipts in ${lastMonthLabel}`,
        value: 'A quiet month',
        detail: 'There are no dated receipts to show for this month.',
      });
    } else {
      const totalSpend = lastMonthReceipts.reduce(
        (sum, receipt) => sum + this.receiptTotal(receipt),
        0,
      );
      const averageSpend = totalSpend / lastMonthReceipts.length;
      const providers = new Map<string, { total: number; count: number }>();
      const products = new Map<
        string,
        { name: string; total: number; count: number }
      >();

      for (const receipt of lastMonthReceipts) {
        const provider = receipt.provider?.trim() || 'Unknown store';
        const providerSummary = providers.get(provider) ?? {
          total: 0,
          count: 0,
        };
        providerSummary.total += this.receiptTotal(receipt);
        providerSummary.count += 1;
        providers.set(provider, providerSummary);

        for (const product of receipt.products) {
          const name = product.name?.trim();
          if (!name) continue;
          const key = name.toLocaleLowerCase();
          const productSummary = products.get(key) ?? {
            name,
            total: 0,
            count: 0,
          };
          productSummary.total +=
            (product.price ?? 0) * (product.quantity ?? 0);
          productSummary.count += product.quantity ?? 0;
          products.set(key, productSummary);
        }
      }

      const topProvider = Array.from(providers.entries()).sort(
        (first, second) => second[1].total - first[1].total,
      )[0];
      const topProduct = Array.from(products.values()).sort(
        (first, second) => second.total - first.total,
      )[0];
      const bestDiscount = lastMonthReceipts.reduce<ReceiptDomain | null>(
        (best, receipt) =>
          (receipt.totalDiscount ?? 0) > (best?.totalDiscount ?? 0)
            ? receipt
            : best,
        null,
      );
      const largestReceipt = lastMonthReceipts.reduce((largest, receipt) =>
        this.receiptTotal(receipt) > this.receiptTotal(largest)
          ? receipt
          : largest,
      );

      stories.push({
        eyebrow: lastMonthLabel,
        title: 'Your spending, in one snapshot',
        value: formatAmount(totalSpend),
        detail: `Across ${lastMonthReceipts.length} receipts in ${lastMonthLabel}, that is an average of ${formatAmount(averageSpend)} per trip.`,
      });

      const largestReceiptSpend = this.receiptTotal(largestReceipt);
      const largestReceiptShare =
        totalSpend > 0
          ? ` It made up ${Math.round((largestReceiptSpend / totalSpend) * 100)}% of the month's spend.`
          : '';
      stories.push({
        eyebrow: 'Biggest trip',
        title: 'Your largest single receipt',
        value: formatAmount(largestReceiptSpend),
        detail: `${largestReceipt.provider || 'A store'} on ${largestReceipt.date?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) || 'last month'}.${largestReceiptShare}`,
      });

      const shoppingDays = Array.from(
        new Set(
          lastMonthReceipts.flatMap((receipt) => {
            if (!receipt.date) return [];
            return [
              Date.UTC(
                receipt.date.getFullYear(),
                receipt.date.getMonth(),
                receipt.date.getDate(),
              ),
            ];
          }),
        ),
      ).sort((first, second) => first - second);
      if (shoppingDays.length > 1) {
        const averageDaysBetweenTrips = Math.round(
          (shoppingDays[shoppingDays.length - 1] - shoppingDays[0]) /
            (shoppingDays.length - 1) /
            86_400_000,
        );
        stories.push({
          eyebrow: 'Your routine',
          title: 'Your shopping rhythm',
          value: `${shoppingDays.length} shopping days`,
          detail: `You shopped on ${shoppingDays.length} different days, about every ${averageDaysBetweenTrips} ${averageDaysBetweenTrips === 1 ? 'day' : 'days'} on average.`,
        });
      }

      const shoppingDaysByWeekday = new Map<number, Set<number>>();
      for (const receipt of lastMonthReceipts) {
        if (!receipt.date) continue;
        const weekday = receipt.date.getDay();
        const day = Date.UTC(
          receipt.date.getFullYear(),
          receipt.date.getMonth(),
          receipt.date.getDate(),
        );
        const days = shoppingDaysByWeekday.get(weekday) ?? new Set<number>();
        days.add(day);
        shoppingDaysByWeekday.set(weekday, days);
      }
      const busiestWeekday = Array.from(shoppingDaysByWeekday.entries()).sort(
        (first, second) => second[1].size - first[1].size,
      )[0];
      if (shoppingDays.length >= 3 && shoppingDaysByWeekday.size > 1) {
        const weekdayName = new Intl.DateTimeFormat('en-US', {
          weekday: 'long',
        }).format(new Date(2023, 0, 1 + busiestWeekday[0]));
        stories.push({
          eyebrow: 'Your routine',
          title: 'Your busiest shopping day',
          value: weekdayName,
          detail: `${busiestWeekday[1].size} of your ${shoppingDays.length} shopping days fell on ${weekdayName}.`,
        });
      }

      if (topProvider) {
        const providerShare =
          totalSpend > 0
            ? Math.round((topProvider[1].total / totalSpend) * 100)
            : 0;
        stories.push({
          eyebrow: 'Your regular stop',
          title: 'Where most of it went',
          value: topProvider[0],
          detail: `${formatAmount(topProvider[1].total)} across ${topProvider[1].count} ${topProvider[1].count === 1 ? 'receipt' : 'receipts'}, or ${providerShare}% of last month's spend.`,
        });
      }

      if (topProduct) {
        stories.push({
          eyebrow: 'Basket highlight',
          title: 'Your biggest product spend',
          value: topProduct.name,
          detail: `${formatAmount(topProduct.total)} across ${topProduct.count} ${topProduct.count === 1 ? 'unit' : 'units'}.`,
        });
      }

      if ((bestDiscount?.totalDiscount ?? 0) > 0) {
        stories.push({
          eyebrow: 'A little win',
          title: 'Your biggest discount',
          value: formatAmount(bestDiscount!.totalDiscount!),
          detail: `Saved at ${bestDiscount!.provider || 'your store'} on ${bestDiscount!.date?.toLocaleDateString('ro-RO') || 'one of your shopping trips'}.`,
        });
      }

      const totalDiscount = lastMonthReceipts.reduce(
        (sum, receipt) => sum + (receipt.totalDiscount ?? 0),
        0,
      );
      if (totalDiscount > 0) {
        stories.push({
          eyebrow: 'Savings check',
          title: 'Discounts added up',
          value: formatAmount(totalDiscount),
          detail: `Total discounts recorded across ${lastMonthReceipts.length} receipts in ${lastMonthLabel}.`,
        });
      }
    }

    if (
      monthlySpend.length > 1 &&
      monthlySpend.some((month) => month.total > 0)
    ) {
      const comparisonTotal = monthlySpend.reduce(
        (sum, month) => sum + month.total,
        0,
      );
      const highestSpendMonth = monthlySpend.reduce((highest, month) =>
        month.total > highest.total ? month : highest,
      );
      const lastMonthKey = lastMonthStart.toLocaleDateString('en-US', {
        month: 'short',
        year: '2-digit',
      });
      const previousMonthStart = new Date(
        lastMonthStart.getFullYear(),
        lastMonthStart.getMonth() - 1,
        1,
      );
      const previousMonthKey = previousMonthStart.toLocaleDateString('en-US', {
        month: 'short',
        year: '2-digit',
      });
      const currentMonthSpend = monthlySpend.find(
        (month) => month.label === lastMonthKey,
      );
      const previousMonthSpend = monthlySpend.find(
        (month) => month.label === previousMonthKey,
      );
      let monthChange = '';
      if (currentMonthSpend && previousMonthSpend) {
        if (previousMonthSpend.total > 0) {
          const difference = currentMonthSpend.total - previousMonthSpend.total;
          const changePercent = Math.round(
            (Math.abs(difference) / previousMonthSpend.total) * 100,
          );
          monthChange =
            difference === 0
              ? ` Spending was unchanged from ${previousMonthSpend.label}.`
              : ` Spending ${difference > 0 ? 'rose' : 'fell'} ${changePercent}% (${formatAmount(Math.abs(difference))}) from ${previousMonthSpend.label}.`;
        } else if (currentMonthSpend.total > 0) {
          monthChange = ` ${previousMonthSpend.label} had no recorded spend; ${currentMonthSpend.label} had ${formatAmount(currentMonthSpend.total)}.`;
        }
      }
      stories.push({
        eyebrow: 'Month by month',
        title: 'How your spending adds up',
        value: formatAmount(comparisonTotal),
        detail: `Across ${monthlySpend.length} months from ${monthlySpend[0].label} to ${monthlySpend[monthlySpend.length - 1].label}. Highest: ${highestSpendMonth.label} at ${highestSpendMonth.amount}; monthly average ${formatAmount(comparisonTotal / monthlySpend.length)}.${monthChange}`,
        monthlySpend: monthlySpend.map(({ label, amount, barWidth }) => ({
          label,
          amount,
          barWidth,
        })),
      });
    }

    return stories;
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
