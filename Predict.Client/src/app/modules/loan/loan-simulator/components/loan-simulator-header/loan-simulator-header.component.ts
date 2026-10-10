import { CommonModule } from '@angular/common';
import {
  Component,
  computed,
  input,
  ChangeDetectionStrategy,
} from '@angular/core';
import { NumberFormatPipe } from 'src/app/shared/pipes/number-format.pipe';
import { Calculator } from 'src/app/shared/utils/calculator.utils';
import { DateUtils } from 'src/app/shared/utils/date.utils';
import { JsDateUtils } from 'src/app/shared/utils/js-date.utils';
import { MonthlyInstalmentManager } from '../../models/loan-simulator.model';

@Component({
  selector: 'p-loan-simulator-header',
  imports: [CommonModule, NumberFormatPipe],
  templateUrl: './loan-simulator-header.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './loan-simulator-header.component.scss',
})
export class LoanSimulatorHeaderComponent {
  monthlyInstalmentGroups = input.required<MonthlyInstalmentManager[]>();

  completedPayments = computed(() =>
    this.monthlyInstalmentGroups().filter((r) => r.completed),
  );
  incompletedPayments = computed(() =>
    this.monthlyInstalmentGroups().filter((r) => !r.completed),
  );

  simulatedPeriod = computed(() => {
    const completedPayments = Math.floor(this.completedPayments().length);
    const incompletedPayments = Math.floor(this.incompletedPayments().length);
    const totalPyments = completedPayments + incompletedPayments;
    const years = Math.floor(totalPyments / 12);
    const months = totalPyments % 12;
    if (years <= 0) return `${months}m`;
    return `${years}y ${months}m`;
  });

  payments = computed(() =>
    this.completedPayments()
      .flatMap((r) => r.instalments)
      .filter((r) => r.instalmentPayment || r.earlyPayment),
  );

  instalmentPayments = computed(() =>
    this.payments().filter((r) => r.instalmentPayment),
  );

  totalInstalmentPayments = computed(() =>
    Calculator.sum(this.instalmentPayments().map((a) => a.totalInstalment)),
  );
  totalInterestPayment = computed(() =>
    Calculator.sum(
      this.instalmentPayments().map((a) =>
        Calculator.sum([a.interestAmount, a.insuranceCost]),
      ),
    ),
  );
  totalPrincipalPayment = computed(() =>
    Calculator.sum(this.payments().map((a) => a.principalAmount)),
  );

  earlyPayments = computed(() => this.payments().filter((r) => r.earlyPayment));

  lastEarlyPayment = computed(() => this.earlyPayments().at(-1));

  totalEarlyPayment = computed(() =>
    Calculator.sum(this.earlyPayments().map((a) => a.principalAmount)),
  );

  paidMonthlyInstalments = computed(() =>
    Calculator.sum(
      this.monthlyInstalmentGroups()
        .filter((r) => r.completed)
        .map((r) => r.instalments.length),
    ),
  );

  monthlyInstalments = computed(() =>
    Calculator.sum(
      this.monthlyInstalmentGroups().map((r) => r.instalments.length),
    ),
  );

  totalPayment = computed(() =>
    Calculator.sum([this.totalInstalmentPayments(), this.totalEarlyPayment()]),
  );

  initialRemainingBalance = computed(() => {
    const firstInstalment = this.payments()[0];
    return Calculator.sum([
      firstInstalment?.remainingBalance,
      firstInstalment?.principalAmount,
    ]);
  });

  get nextPayment() {
    const now = new Date();
    const target = DateUtils.newDate(
      now.getFullYear(),
      now.getMonth() + 1,
      17,
      20,
      0,
    );
    if (JsDateUtils.isBefore(now, target))
      return JsDateUtils.dateDiffYMD(now, target);

    return JsDateUtils.dateDiffYMD(now, JsDateUtils.addMonths(target, 1));
  }
}
