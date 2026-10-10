export type LoanSimulatorInstalment = {
  instalmentId: number | null;
  paymentDate: Date | null;
  newPaymentDate: Date | null;
  interestAmount: number | null;
  principalAmount: number | null;
  administrationFee: number | null;
  insuranceCost: number | null;
  managementFee: number | null;
  recalculatedInterest: number | null;
  totalInstalment: number | null;
  batchTotalInstalment?: number | null;
  batchTotalEarlyPayment?: number | null;
  remainingBalance: number | null;
  instalmentPayment: boolean;
  earlyPayment: boolean;
  disabled: boolean;
  recalculated: boolean;
};

export type LoanSimulatorRepaymentSchedule = {
  name: string;
  loanSimulatorInstalments: LoanSimulatorInstalment[];
};

export class MonthlyInstalmentManager {
  public completed: boolean = false;
  public expanded: boolean = false;
  public id: number;
  public title: Date;

  constructor(public instalments: LoanSimulatorInstalment[]) {
    if (!instalments.length) return;

    this.completed = instalments.some((i) => i.instalmentPayment);
    this.id = instalments[0]?.instalmentId ?? 0;
    this.title = instalments[0].newPaymentDate ?? null;
  }
}
