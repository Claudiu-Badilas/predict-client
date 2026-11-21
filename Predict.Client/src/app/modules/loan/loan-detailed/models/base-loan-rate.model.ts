export type HistoricalInstalmentPayment = {
  index: number;
  paymentDate: Date;
  principalAmount: number;
  interestAmount: number;
  insuranceCost: number;
  totalInstalment?: number;
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
