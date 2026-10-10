import { CommonModule } from '@angular/common';
import {
  Component,
  computed,
  inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import { LoanStore } from 'src/app/modules/loan/stores/loan.store';
import { NumberFormatPipe } from 'src/app/shared/pipes/number-format.pipe';
import { Calculator } from 'src/app/shared/utils/calculator.utils';
import { JsDateUtils } from 'src/app/shared/utils/js-date.utils';
import { MathUtil } from 'src/app/shared/utils/math.utils';

@Component({
  selector: 'p-loan-detailed-header',
  imports: [CommonModule, NumberFormatPipe],
  templateUrl: './loan-detailed-header.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './loan-detailed-header.component.scss',
})
export class LoanDetailedHeaderComponent {
  private readonly store = inject(LoanStore);

  readonly updatedBaseRepaymentScheduleBasedOnLatestStates =
    this.store.historicalInstalments;
  readonly historicalInstalmentPaymentBatches =
    this.store.historicalInstalmentPaymentBatches;

  readonly paidPrincipal = computed(() =>
    Calculator.sum(
      this.updatedBaseRepaymentScheduleBasedOnLatestStates()
        .filter((s) => s.earlyPayment || s.instalmentPayment)
        .map((s) => s.principalAmount),
    ),
  );
  readonly paidPrincipalPercent = computed(() => {
    const total = Calculator.sum(
      this.updatedBaseRepaymentScheduleBasedOnLatestStates().map(
        (s) => s.principalAmount,
      ),
    );

    return MathUtil.percent(this.paidPrincipal(), total);
  });

  readonly paidIntrest = computed(() =>
    Calculator.sum(
      this.updatedBaseRepaymentScheduleBasedOnLatestStates()
        .filter((s) => s.instalmentPayment)
        .map((s) => s.interestAmount),
    ),
  );

  readonly paidInsurance = computed(() =>
    Calculator.sum(
      this.updatedBaseRepaymentScheduleBasedOnLatestStates()
        .filter((s) => s.instalmentPayment)
        .map((s) => s.insuranceCost),
    ),
  );

  readonly totalPaid = computed(() =>
    Calculator.sum([
      this.paidPrincipal(),
      this.paidIntrest(),
      this.paidInsurance(),
    ]),
  );

  readonly paidInstalments = computed(() =>
    Calculator.sum(
      this.historicalInstalmentPaymentBatches()
        .filter((s) => s.completed)
        .map((s) => s.instalments.length),
    ),
  );

  readonly unpaidInstalments = computed(() =>
    Calculator.sum(
      this.historicalInstalmentPaymentBatches().map(
        (s) => s.instalments.length,
      ),
    ),
  );

  readonly lastInstalmentPaymentDate = computed(() => {
    const schedule = this.updatedBaseRepaymentScheduleBasedOnLatestStates();
    return schedule?.at(-1)?.paymentDate ?? null;
  });

  readonly firstInstalmentPaymentDate = computed(
    () =>
      this.historicalInstalmentPaymentBatches()
        .filter((s) => s.completed)
        .at(-1)
        ?.instalments?.at(0)?.paymentDate ?? null,
  );

  readonly dateDiffYMD = computed(() => {
    const d1 = this.firstInstalmentPaymentDate();
    const d2 = this.lastInstalmentPaymentDate();
    return JsDateUtils.dateDiffYMD(d1, d2);
  });
}
