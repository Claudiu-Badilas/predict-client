import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { NumberFormatPipe } from 'src/app/shared/pipes/number-format.pipe';
import { Calculator } from 'src/app/shared/utils/calculator.utils';
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

    const sortedGroups = [...filteredGroups].sort((a, b) => {
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

    return sortedGroups.map((group) => {
      const paymentRows = group.instalments.filter(
        (row) => row.instalmentPayment || row.earlyPayment,
      );

      const installment = paymentRows.find((row) => row.instalmentPayment);
      const early = paymentRows.filter((row) => row.earlyPayment);

      return {
        title: group.title,
        instalments: paymentRows,
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
  });
}
