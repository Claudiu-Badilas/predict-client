import { Instalment, RepaymentSchedule } from '../../models/loan.model';
import { HistoricalInstalmentPayment } from '../models/base-loan-rate.model';

export namespace HistoricalInstalmentPaymentsUtils {
  export function getHistoricalInstalmentPayments(
    base: RepaymentSchedule,
    repaymentSchedules: RepaymentSchedule[],
  ): HistoricalInstalmentPayment[] {
    if (!base?.monthlyInstalments?.length || !repaymentSchedules?.length)
      return [];

    const schedules = repaymentSchedules
      .slice()
      .sort((a, b) => a.date.valueOf() - b.date.valueOf());

    const toBaseLoanInstalment = (
      additionalId: number,
      paymentDate: Date,
      instalment: Instalment,
      isNormalPayment: boolean,
      isExtraPayment: boolean,
    ): HistoricalInstalmentPayment =>
      ({
        index: instalment.instalmentId + additionalId,
        paymentDate: paymentDate || instalment.paymentDate,
        principalAmount: instalment.principalAmount,
        interestAmount: instalment.interestAmount,
        insuranceCost: instalment.insuranceCost,
        remainingBalance: instalment.remainingBalance,
        instalmentPayment: isNormalPayment,
        earlyPayment: isExtraPayment,
      }) as HistoricalInstalmentPayment;

    const calculatedBaseLoanInstalments = schedules.flatMap((schedule, i) => {
      if (i === 0) return [];
      const prevSchedule = schedules[i - 1];
      const index =
        prevSchedule.monthlyInstalments.length -
        schedule.monthlyInstalments.length;

      const instalments = [...prevSchedule.monthlyInstalments].splice(0, index);

      return instalments.map((instalment) =>
        toBaseLoanInstalment(
          0,
          schedule.date,
          instalment,
          schedule.isNormalPayment,
          schedule.isExtraPayment,
        ),
      );
    });

    const unpaidInstalments = schedules
      .at(-1)
      .monthlyInstalments.map((instalment) =>
        toBaseLoanInstalment(
          calculatedBaseLoanInstalments.length,
          null,
          instalment,
          false,
          false,
        ),
      );

    return calculatedBaseLoanInstalments.concat(unpaidInstalments);
  }
}
