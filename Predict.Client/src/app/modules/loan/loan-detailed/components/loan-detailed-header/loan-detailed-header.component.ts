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
  readonly simulationMonthlyInstalmentBatches =
    this.store.simulationMonthlyInstalmentBatches;
  readonly baseRepaymentSchedule = this.store.baseRepaymentSchedule;
  readonly includeSimulation = this.store.includeDetailedSimulation;

  readonly simulatedPayments = computed(() =>
    this.simulationMonthlyInstalmentBatches()
      .flatMap((batch) => batch.instalments)
      .filter(
        (instalment) =>
          instalment.instalmentPayment || instalment.earlyPayment,
      ),
  );
  readonly hasSimulatedPayments = computed(
    () => this.includeSimulation() && this.simulatedPayments().length > 0,
  );
  readonly simulatedPaidPrincipal = computed(
    () =>
      (this.paidPrincipal() ?? 0) +
      (Calculator.sum(
        this.simulatedPayments().map(
          (instalment) => instalment.principalAmount ?? 0,
        ),
      ) ?? 0),
  );
  readonly simulatedPaidPrincipalPercent = computed(() => {
    const total = Calculator.sum(
      this.updatedBaseRepaymentScheduleBasedOnLatestStates()
        .map((instalment) => instalment.principalAmount ?? 0),
    );

    return MathUtil.percent(this.simulatedPaidPrincipal(), total);
  });
  readonly simulatedPaidInterest = computed(
    () =>
      (this.paidIntrest() ?? 0) +
      (Calculator.sum(
        this.simulatedPayments()
          .filter((instalment) => instalment.instalmentPayment)
          .map((instalment) => instalment.interestAmount ?? 0),
      ) ?? 0),
  );
  readonly simulatedPaidInsurance = computed(
    () =>
      (this.paidInsurance() ?? 0) +
      (Calculator.sum(
        this.simulatedPayments()
          .filter((instalment) => instalment.instalmentPayment)
          .map((instalment) => instalment.insuranceCost ?? 0),
      ) ?? 0),
  );
  readonly simulatedTotalPaid = computed(
    () =>
      this.simulatedPaidPrincipal() +
      this.simulatedPaidInterest() +
      this.simulatedPaidInsurance(),
  );
  readonly simulatedPaidInstalments = computed(
    () => (this.paidInstalments() ?? 0) + this.simulatedPayments().length,
  );
  readonly simulatedTotalInstalments = computed(
    () => this.baseRepaymentSchedule()?.monthlyInstalments.length ?? 0,
  );
  readonly simulatedFirstInstalmentPaymentDate = computed(
    () => this.simulatedPayments().find((payment) => payment.newPaymentDate)
      ?.newPaymentDate ?? null,
  );
  readonly simulatedLastInstalmentPaymentDate = computed(
    () => this.simulatedPayments().at(-1)?.newPaymentDate ?? null,
  );
  readonly simulatedDateDiffYMD = computed(() => {
    const durationStartDate = this.firstInstalmentPaymentDate();
    const durationEndDate = this.lastInstalmentPaymentDate();
    const simulationStartDate = this.simulatedFirstInstalmentPaymentDate();
    const simulationEndDate = this.simulatedLastInstalmentPaymentDate();

    if (
      !JsDateUtils.isValidDate(durationStartDate) ||
      !JsDateUtils.isValidDate(durationEndDate) ||
      !JsDateUtils.isValidDate(simulationStartDate) ||
      !JsDateUtils.isValidDate(simulationEndDate)
    ) {
      return null;
    }

    const simulatedPeriodMonths =
      (simulationEndDate.getFullYear() - simulationStartDate.getFullYear()) *
        12 +
      simulationEndDate.getMonth() -
      simulationStartDate.getMonth();
    const extraPaymentMonths = this.simulatedPayments().filter(
      (payment) => payment.earlyPayment,
    ).length;
    const reducedEndDate = JsDateUtils.addMonths(
      durationEndDate,
      -(simulatedPeriodMonths + extraPaymentMonths),
    );
    const adjustedEndDate = JsDateUtils.isBefore(
      reducedEndDate,
      durationStartDate,
    )
      ? durationStartDate
      : reducedEndDate;

    return JsDateUtils.dateDiffYMD(durationStartDate, adjustedEndDate);
  });

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
        .at(0)
        ?.instalments?.at(0)?.paymentDate ?? null,
  );

  readonly dateDiffYMD = computed(() => {
    const d1 = this.firstInstalmentPaymentDate();
    const d2 = this.lastInstalmentPaymentDate();
    return JsDateUtils.dateDiffYMD(d1, d2);
  });
}
