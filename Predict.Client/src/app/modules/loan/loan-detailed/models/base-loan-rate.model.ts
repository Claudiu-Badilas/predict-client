import { Calculator } from 'src/app/shared/utils/calculator.utils';
import { RepaymentSchedule } from '../../models/loan.model';
import { HistoricalInstalmentPaymentBatchesUtils } from '../utils/historical-instalment-payment-batches.utils';
import { HistoricalInstalmentPaymentsUtils } from '../utils/historical-instalment-payments.utils';
import { JsDateUtils } from 'src/app/shared/utils/js-date.utils';

export type HistoricalInstalmentPayment = {
  index: number;
  paymentDate: Date;
  principalAmount: number;
  interestAmount: number;
  insuranceCost: number;
  remainingBalance: number;
  instalmentPayment: boolean;
  earlyPayment: boolean;
};

export class HistoricalInstalmentPaymentBatch {
  public completed: boolean = false;
  public expanded: boolean = true;
  public id: number;
  public title: Date;

  constructor(public instalments: HistoricalInstalmentPayment[]) {
    if (!instalments.length) return;

    this.completed = instalments.some((i) => i.instalmentPayment);
    this.expanded = !this.completed;
    this.id = instalments[0]?.index ?? 0;
    this.title = instalments[0].paymentDate ?? null;
  }
}

export class HistoricalInstalmentPaymentBatchesManager {
  public historicalInstalmentPaymentBatch: HistoricalInstalmentPaymentBatch[];

  constructor(
    base: RepaymentSchedule,
    public selected: RepaymentSchedule,
    public repaymentSchedules: RepaymentSchedule[],
  ) {
    this.historicalInstalmentPaymentBatch =
      HistoricalInstalmentPaymentBatchesUtils.getHistoricalInstalmentPaymentBatches(
        HistoricalInstalmentPaymentsUtils.getHistoricalInstalmentPayments(
          base,
          repaymentSchedules,
        ),
      );
  }

  getBaseName() {
    return this.selected?.name?.split(' - ')[0] ?? null;
  }

  getPaidAmmount() {
    return Calculator.sum(
      this.historicalInstalmentPaymentBatch
        .flatMap((b) =>
          b.instalments.filter((i) => i.instalmentPayment || i.earlyPayment),
        )
        .map((i) =>
          i.instalmentPayment
            ? Calculator.sum([
                i.interestAmount,
                i.principalAmount,
                i.insuranceCost,
              ])
            : i.principalAmount,
        ),
    );
  }

  getUnpaidAmmount() {
    return Calculator.sum(
      this.historicalInstalmentPaymentBatch
        .flatMap((b) =>
          b.instalments.filter((i) => !i.instalmentPayment && !i.earlyPayment),
        )
        .map((i) =>
          Calculator.sum([
            i.interestAmount,
            i.principalAmount,
            i.insuranceCost,
          ]),
        ),
    );
  }

  getUnpaidPrincipalAmmount() {
    return Calculator.sum(
      this.historicalInstalmentPaymentBatch
        .flatMap((b) =>
          b.instalments.filter((i) => !i.instalmentPayment && !i.earlyPayment),
        )
        .map((i) => i.principalAmount),
    );
  }

  getUnpaidAmmountInterest() {
    return Calculator.sum(
      this.historicalInstalmentPaymentBatch
        .flatMap((b) =>
          b.instalments.filter((i) => !i.instalmentPayment && !i.earlyPayment),
        )
        .map((i) => i.interestAmount),
    );
  }

  getUnpaidInsuranceAmmount() {
    return Calculator.sum(
      this.historicalInstalmentPaymentBatch
        .flatMap((b) =>
          b.instalments.filter((i) => !i.instalmentPayment && !i.earlyPayment),
        )
        .map((i) => i.insuranceCost),
    );
  }

  getLastPaidMonth() {
    return (
      this.historicalInstalmentPaymentBatch.filter((b) => b.completed)?.at(-1)
        ?.title ?? null
    );
  }

  getLastUnaidMonth() {
    return this.historicalInstalmentPaymentBatch?.at(-1)?.title ?? null;
  }

  getDuration() {
    const d1 = this.selected.monthlyInstalments[0]?.paymentDate;
    const d2 = this.selected.monthlyInstalments?.at(-1)?.paymentDate;
    return JsDateUtils.dateDiffYMD(d1, d2);
  }
}
