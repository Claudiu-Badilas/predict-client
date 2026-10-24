import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { NumberFormatPipe } from 'src/app/shared/pipes/number-format.pipe';
import { Calculator } from 'src/app/shared/utils/calculator.utils';
import { MonthlyInstalmentManager } from '../../../loan-simulator/models/loan-simulator.model';
import { HistoricalInstalmentPaymentBatch } from '../../models/base-loan-rate.model';

@Component({
  selector: 'p-historical-instalments-table',
  imports: [CommonModule, NumberFormatPipe],
  templateUrl: './historical-instalments-table.component.html',
  styleUrl: './historical-instalments-table.component.scss',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class HistoricalInstalmentsTableComponent {
  monthlyInstalmentGroups = input<HistoricalInstalmentPaymentBatch[]>([]);
  simulationInstalmentGroups = input<MonthlyInstalmentManager[]>([]);

  monthlyGroups = computed(() => {
    const groups = this.monthlyInstalmentGroups();

    const filteredGroups = groups
      .map((group) => ({
        ...group,
        instalments: group.instalments.filter(
          (row) => row.instalmentPayment || row.earlyPayment,
        ),
      }))
      .filter((group) => group.instalments.length > 0);

    const historicalGroups = filteredGroups.map((group) => {
      const paymentRows = group.instalments.filter(
        (row) => row.instalmentPayment || row.earlyPayment,
      );

      const installment = paymentRows.find((row) => row.instalmentPayment);
      const early = paymentRows.filter((row) => row.earlyPayment);

      return {
        title: group.title,
        isSimulation: false,
        subtotal: {
          instalmentsCount: installment ? 1 : 0,
          earlyCount: early.length,
          principal: Calculator.sum(
            paymentRows.map((row) => row.principalAmount),
          ),
          interest: installment?.interestAmount || 0,
          insuranceCost: installment?.insuranceCost || 0,
          total: Calculator.sum(
            paymentRows
              .map((row) => row.principalAmount)
              .concat([
                installment?.interestAmount || 0,
                installment?.insuranceCost || 0,
              ]),
          ),
          remainingBalance:
            early.at(-1)?.remainingBalance ||
            installment?.remainingBalance ||
            0,
          count: paymentRows.length,
        },
      };
    });

    const simulatedGroups = this.simulationInstalmentGroups()
      .map((group) => {
        const payments = group.instalments.filter(
          (row) => row.instalmentPayment || row.earlyPayment,
        );
        const instalment = payments.find((row) => row.instalmentPayment);
        const early = payments.filter((row) => row.earlyPayment);
        const amount = (value: number | null | undefined) => value ?? 0;

        return {
          title: group.title,
          isSimulation: true,
          subtotal: {
            instalmentsCount: instalment ? 1 : 0,
            earlyCount: early.length,
            principal: Calculator.sum(
              payments.map((row) => amount(row.principalAmount)),
            ),
            interest: amount(instalment?.interestAmount),
            insuranceCost: amount(instalment?.insuranceCost),
            total:
              Calculator.sum(early.map((row) => amount(row.principalAmount))) +
              amount(instalment?.totalInstalment),
            remainingBalance: amount(
              payments.at(-1)?.remainingBalance ??
                group.instalments.at(-1)?.remainingBalance,
            ),
          },
        };
      })
      .filter(
        (group) =>
          group.subtotal.instalmentsCount + group.subtotal.earlyCount > 0,
      );

    return [...historicalGroups, ...simulatedGroups].sort((a, b) => {
      const dateA =
        a.title instanceof Date
          ? a.title.getTime()
          : new Date(a.title).getTime();
      const dateB =
        b.title instanceof Date
          ? b.title.getTime()
          : new Date(b.title).getTime();

      return dateB - dateA;
    });
  });
}
