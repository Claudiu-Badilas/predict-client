import { Calculator } from 'src/app/shared/utils/calculator.utils';
import { RepaymentSchedule } from '../../models/loan.model';
import {
  MonthlyInstalmentManager,
  LoanSimulatorInstalment,
} from '../models/loan-simulator.model';
import { DateStateManager } from './date-state-manager.service';

export function generateMonthlyInstalmentBatches(
  base: RepaymentSchedule | null,
  selectedInstalmentPayments: number[],
  selectedEarlyPayments: number[],
): MonthlyInstalmentManager[] {
  if (!base) return [];

  const overviewBaseLoanInstalments = createOverviewBaseLoanInstalments(
    base,
    selectedInstalmentPayments,
    selectedEarlyPayments,
  );

  const monthlyInstalmentBatches = createMonthlyInstalmentBatches(
    overviewBaseLoanInstalments,
  );

  return monthlyInstalmentBatches;
}

function createOverviewBaseLoanInstalments(
  base: RepaymentSchedule,
  selectedInstalmentPayments: number[],
  selectedEarlyPayments: number[],
): LoanSimulatorInstalment[] {
  const dateManager = new DateStateManager();
  const selectedInstalmentSet = new Set(selectedInstalmentPayments);
  const selectedEarlyPaymentSet = new Set(selectedEarlyPayments);

  return base.monthlyInstalments
    .map((instalment, index, arr) => {
      const previousInstalment = arr[index - 1];

      const hasInstalmentPayment = selectedInstalmentSet.has(
        instalment.instalmentId,
      );
      const hasEarlyPayment = selectedEarlyPaymentSet.has(
        instalment.instalmentId,
      );
      const previousHadInstalment = previousInstalment
        ? selectedInstalmentSet.has(previousInstalment?.instalmentId)
        : false;

      dateManager.updateForInstalment(hasInstalmentPayment);
      dateManager.updateForEarlyPayment(previousHadInstalment, hasEarlyPayment);

      const newPaymentDate = dateManager.calculateNewPaymentDate(
        instalment.paymentDate,
        hasInstalmentPayment,
        hasEarlyPayment,
      );

      return {
        instalmentId: instalment.instalmentId,
        paymentDate: instalment.paymentDate,
        newPaymentDate,
        interestAmount: instalment.interestAmount,
        principalAmount: instalment.principalAmount,
        administrationFee: instalment.administrationFee,
        insuranceCost: instalment.insuranceCost,
        managementFee: instalment.managementFee,
        recalculatedInterest: instalment.recalculatedInterest,
        totalInstalment: instalment.totalInstalment,
        remainingBalance: instalment.remainingBalance,
        instalmentPayment: hasInstalmentPayment,
        earlyPayment: hasEarlyPayment,
        disabled: false,
        recalculated: instalment.recalculated,
      } as LoanSimulatorInstalment;
    })
    .map((instalment, i, arr) => {
      const prev = arr[i - 1];
      const next = arr[i + 1];

      let enable = true;

      if (!prev && next) {
        enable = i === 0 && !next.instalmentPayment && !next.earlyPayment;
      } else if (prev && next) {
        enable =
          (!instalment.instalmentPayment &&
            !instalment.earlyPayment &&
            (prev.instalmentPayment || prev.earlyPayment)) ||
          (!next.instalmentPayment &&
            !next.earlyPayment &&
            (instalment.instalmentPayment || instalment.earlyPayment));
      }
      return { ...instalment, disabled: !enable } as LoanSimulatorInstalment;
    });
}

function createMonthlyInstalmentBatches(
  overviewBaseLoanInstalments: LoanSimulatorInstalment[],
): MonthlyInstalmentManager[] {
  const batches: MonthlyInstalmentManager[] = [];
  let tempBatch: LoanSimulatorInstalment[] = [];

  overviewBaseLoanInstalments.forEach((current, index, array) => {
    const next = array[index + 1];

    const total = (val: LoanSimulatorInstalment) =>
      val.earlyPayment ? val.principalAmount : val.totalInstalment;
    const batchTotalInstalment = Calculator.sum([
      ...tempBatch.map((v) => total(v)),
      total(current),
    ]);

    const early = (val: LoanSimulatorInstalment) =>
      val.earlyPayment ? val.principalAmount : 0;
    const batchTotalEarlyPayment = Calculator.sum([
      ...tempBatch.map((v) => early(v)),
      early(current),
    ]);

    tempBatch.push({
      ...current,
      batchTotalInstalment,
      batchTotalEarlyPayment,
    } as LoanSimulatorInstalment);

    if (current.instalmentPayment || current.earlyPayment) {
      if (next && !next.earlyPayment) {
        batches.push(new MonthlyInstalmentManager(tempBatch));
        tempBatch = [];
      }
    }
    if ((!current.instalmentPayment && !current.earlyPayment) || !next) {
      batches.push(new MonthlyInstalmentManager(tempBatch));
      tempBatch = [];
    }
  });

  return batches.map((b, i) => {
    // b.expanded = i === 0;
    return b;
  });
}
