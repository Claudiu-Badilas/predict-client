import { HistoricalInstalmentPayment } from '../../models/base-loan-rate.model';
import { InstalmentSimulationRow } from 'src/app/modules/loan/loan-simulator/utils/instalment-simulation.utils';
import { DateStateManager } from 'src/app/modules/loan/loan-simulator/utils/date-state-manager.service';

export interface SimulatedPaymentProjection {
  paymentDate: Date;
  normalPaymentAmount: number;
  extraPaymentAmount: number;
}

/** Rebuilds the unpaid payment timeline for chart display without changing loan state. */
export namespace SimulatedPaymentProjectionUtils {
  export function getRemainingPayments(
    historicalPayments: HistoricalInstalmentPayment[],
    combinations: InstalmentSimulationRow[],
  ): SimulatedPaymentProjection[] {
    const firstUnpaidIndex = historicalPayments.findIndex(
      (payment) => !payment.instalmentPayment && !payment.earlyPayment,
    );
    if (firstUnpaidIndex < 0) return [];

    const remaining = historicalPayments.slice(firstUnpaidIndex);
    const openingBalance =
      remaining[0].principalAmount + remaining[0].remainingBalance;
    if (openingBalance <= 0) return [];

    const { normalIndexes, extraIndexes } = getPaymentPlan(
      remaining,
      combinations,
    );
    const dateManager = new DateStateManager();
    const projection: SimulatedPaymentProjection[] = [];
    let balance = openingBalance;
    let previousWasNormal = false;

    remaining.forEach((source, index) => {
      if (balance <= 0) return;

      const isNormal = normalIndexes.has(index);
      const isExtra = extraIndexes.has(index);
      dateManager.updateForInstalment(isNormal);
      dateManager.updateForEarlyPayment(previousWasNormal, isExtra);
      const paymentDate = dateManager.calculateNewPaymentDate(
        source.paymentDate,
        isNormal,
        isExtra,
      );
      previousWasNormal = isNormal;
      if (!paymentDate) return;

      const baseOpeningBalance = source.principalAmount + source.remainingBalance;
      const interestRate =
        baseOpeningBalance > 0 ? source.interestAmount / baseOpeningBalance : 0;
      const insuranceRate =
        baseOpeningBalance > 0 ? source.insuranceCost / baseOpeningBalance : 0;

      if (isExtra) {
        const extraPaymentAmount = Math.min(
          balance,
          Math.max(0, source.principalAmount),
        );
        balance = round(balance - extraPaymentAmount);
        projection.push({ paymentDate, normalPaymentAmount: 0, extraPaymentAmount });
        return;
      }

      const interestAmount = round(balance * interestRate);
      const insuranceCost = round(balance * insuranceRate);
      const basePaymentAmount =
        source.principalAmount + source.interestAmount + source.insuranceCost;
      const principalAmount = Math.min(
        balance,
        Math.max(0, basePaymentAmount - interestAmount - insuranceCost),
      );
      const normalPaymentAmount = round(
        principalAmount + interestAmount + insuranceCost,
      );
      balance = round(balance - principalAmount);
      projection.push({ paymentDate, normalPaymentAmount, extraPaymentAmount: 0 });
    });

    return projection;
  }

  function getPaymentPlan(
    remaining: HistoricalInstalmentPayment[],
    combinations: InstalmentSimulationRow[],
  ): { normalIndexes: Set<number>; extraIndexes: Set<number> } {
    const normalIndexes = new Set<number>();
    const extraIndexes = new Set<number>();
    let cursor = 0;

    for (const { monthlyAmount, payments } of combinations) {
      if (cursor >= remaining.length) break;
      if (monthlyAmount === null || monthlyAmount <= 0) break;

      let accumulatedAmount = 0;
      let accumulatedPayments = 1;
      let consumedCount = 0;

      for (let i = cursor; i < remaining.length; i++) {
        const payment = remaining[i];
        const tempAccumulatedAmount = accumulatedAmount + payment.principalAmount;

        if (i === cursor) {
          normalIndexes.add(i);
          accumulatedAmount = getNormalAmount(payment);
          consumedCount++;
        } else if (
          tempAccumulatedAmount > monthlyAmount + 100 ||
          accumulatedAmount > monthlyAmount
        ) {
          if (payments !== null && accumulatedPayments === payments) break;
          normalIndexes.add(i);
          accumulatedAmount = getNormalAmount(payment);
          accumulatedPayments++;
          consumedCount++;
        } else if (accumulatedAmount <= monthlyAmount) {
          extraIndexes.add(i);
          accumulatedAmount += payment.principalAmount;
          consumedCount++;
        }
      }

      if (consumedCount === 0) break;
      cursor += consumedCount;
    }

    return { normalIndexes, extraIndexes };
  }

  function getNormalAmount(payment: HistoricalInstalmentPayment): number {
    return (
      payment.totalInstalment ??
      payment.principalAmount + payment.interestAmount + payment.insuranceCost
    );
  }

  function round(value: number): number {
    return Math.round(value * 100) / 100;
  }
}
