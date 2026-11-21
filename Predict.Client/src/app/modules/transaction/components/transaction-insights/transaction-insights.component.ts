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
import {
  TransactionCategory,
  TransactionDomain,
} from '../../models/transactions.model';

interface TransactionInsight {
  eyebrow: string;
  title: string;
  value: string;
  income?: string;
  balance?: string;
  comparison?: string;
  transactionCount?: number;
  topCategories?: string[];
  largestPurchase?: string;
  monthlySpend?: { label: string; amount: string; barWidth: number }[];
}

@Component({
  selector: 'p-transaction-insights',
  imports: [CommonModule],
  templateUrl: './transaction-insights.component.html',
  styleUrl: './transaction-insights.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown)': 'handleStoryKeyboard($event)' },
})
export class TransactionInsightsComponent implements OnDestroy {
  private readonly overlay = inject(Overlay);
  private readonly viewContainerRef = inject(ViewContainerRef);
  private readonly storyOverlay =
    viewChild.required<TemplateRef<unknown>>('storyOverlay');

  transactions = input<TransactionDomain[]>([]);
  economiiTransactions = input<TransactionDomain[]>([]);
  startDate = input.required<Date>();
  endDate = input.required<Date>();
  showEconomii = input(false);

  showInsights = signal(false);
  activeStory = signal(0);
  isStoryPaused = signal(false);
  insightStories = computed(() =>
    this.createInsightStories(
      this.showEconomii() ? this.economiiTransactions() : this.transactions(),
      this.showEconomii(),
    ),
  );
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
      panelClass: 'transaction-insights-overlay-pane',
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

  private createInsightStories(
    transactions: TransactionDomain[],
    isEconomii: boolean,
  ): TransactionInsight[] {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(
      currentMonthStart.getFullYear(),
      currentMonthStart.getMonth() - 1,
      1,
    );
    const transactionDate = (transaction: TransactionDomain) =>
      transaction.completionDate || transaction.registrationDate;
    const eligibleTransactions = transactions.filter(
      (transaction) =>
        transaction.category !== TransactionCategory.INTERNAL_TRANSFER,
    );
    const currency =
      transactions
        .find((transaction) => transaction.currency?.trim())
        ?.currency?.trim() || 'RON';
    const formatAmount = (amount: number) =>
      `${new Intl.NumberFormat('ro-RO', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount)} ${currency}`;
    const signedAmount = (amount: number) =>
      `${amount > 0 ? '+' : amount < 0 ? '−' : ''}${formatAmount(Math.abs(amount))}`;
    const months = Array.from(
      { length: 6 },
      (_, index) =>
        new Date(
          lastMonthStart.getFullYear(),
          lastMonthStart.getMonth() - index,
          1,
        ),
    );
    const monthlyTotals = months.map((monthStart) => {
      const nextMonth = new Date(
        monthStart.getFullYear(),
        monthStart.getMonth() + 1,
        1,
      );
      const monthTransactions = eligibleTransactions.filter((transaction) => {
        const date = transactionDate(transaction);
        return date !== null && date >= monthStart && date < nextMonth;
      });
      const expenses = monthTransactions.filter(
        (transaction) => (transaction.amount ?? 0) < 0,
      );
      const income = monthTransactions
        .filter((transaction) => (transaction.amount ?? 0) > 0)
        .reduce((sum, transaction) => sum + (transaction.amount ?? 0), 0);
      const spent = expenses.reduce(
        (sum, transaction) => sum + Math.abs(transaction.amount ?? 0),
        0,
      );
      const categories = new Map<string, number>();
      for (const transaction of expenses) {
        const category = transaction.categoryLabel?.trim() || 'Other';
        categories.set(
          category,
          (categories.get(category) ?? 0) + Math.abs(transaction.amount ?? 0),
        );
      }
      const topCategories = Array.from(categories.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([name, amount]) => `${name}: ${formatAmount(amount)}`);
      const largestExpense = expenses.reduce<TransactionDomain | null>(
        (largest, transaction) =>
          Math.abs(transaction.amount ?? 0) > Math.abs(largest?.amount ?? 0)
            ? transaction
            : largest,
        null,
      );
      const biggestMerchant =
        largestExpense?.serviceProvider?.trim() ||
        largestExpense?.merchantName?.trim() ||
        largestExpense?.provider?.trim();
      const biggestExpense = largestExpense
        ? Math.abs(largestExpense.amount ?? 0)
        : 0;
      return {
        monthStart,
        monthTransactions,
        income,
        spent,
        topCategories,
        biggestMerchant,
        biggestExpense,
      };
    });
    const lastMonthIncome = monthlyTotals[0]?.income ?? 0;
    return monthlyTotals.map(
      ({
        monthStart,
        monthTransactions,
        income,
        spent,
        topCategories,
        biggestMerchant,
        biggestExpense,
      }) => {
        const monthLabel = monthStart.toLocaleDateString('en-US', {
          month: 'long',
          year: 'numeric',
        });
        const comparison =
          lastMonthIncome > 0
            ? `${((spent / lastMonthIncome) * 100).toFixed(0)}% of last month's income (${formatAmount(lastMonthIncome)})`
            : 'No income recorded last month';
        return {
          eyebrow: `Six-month story · ${monthLabel}`,
          title: isEconomii
            ? `Savings activity in ${monthLabel}`
            : `Your money in ${monthLabel}`,
          value: formatAmount(spent),
          income: formatAmount(income),
          balance: signedAmount(income - spent),
          comparison,
          transactionCount: monthTransactions.length,
          topCategories,
          largestPurchase: biggestExpense
            ? `${formatAmount(biggestExpense)}${biggestMerchant ? ` at ${biggestMerchant}` : ''}`
            : undefined,
        };
      },
    );
  }
}
