import { JsDateUtils } from 'src/app/shared/utils/js-date.utils';

export class DateStateManager {
  private newPaymentDate: Date | null = null;
  private isInstalmentDateUpdate = false;
  private isEarlyPayDateUpdate = false;
  private isFirstBaseIdentical = true;

  updateForInstalment(hasInstalmentPayment: boolean): void {
    if (hasInstalmentPayment) {
      this.isInstalmentDateUpdate = true;
    }
  }

  updateForEarlyPayment(
    previousHadInstalment: boolean,
    hasEarlyPayment: boolean,
  ): void {
    if (previousHadInstalment && hasEarlyPayment) {
      this.isEarlyPayDateUpdate = true;
    }
  }

  calculateNewPaymentDate(
    paymentDate: Date,
    instalmentPayment: boolean,
    earlyPayment: boolean,
  ): Date | null {
    if (!this.newPaymentDate && this.isInstalmentDateUpdate) {
      this.newPaymentDate = paymentDate;
      this.isInstalmentDateUpdate = false;
      return this.newPaymentDate;
    }

    if (this.isEarlyPayDateUpdate && this.newPaymentDate && earlyPayment) {
      this.newPaymentDate = JsDateUtils.addDays(this.newPaymentDate, 1);
      this.isEarlyPayDateUpdate = false;
      return this.newPaymentDate;
    }

    if (this.newPaymentDate && this.isInstalmentDateUpdate) {
      this.newPaymentDate = this.adjustDateForInstalment();
      this.isInstalmentDateUpdate = false;
      return this.newPaymentDate;
    }

    if (this.newPaymentDate && !instalmentPayment && !earlyPayment) {
      return this.handleRegularPayment();
    }

    return this.newPaymentDate;
  }

  private adjustDateForInstalment(): Date {
    return JsDateUtils.addMonths(
      JsDateUtils.addDays(this.newPaymentDate!, -1),
      1,
    );
  }

  private handleRegularPayment(): Date {
    if (this.isFirstBaseIdentical) {
      this.newPaymentDate = JsDateUtils.addDays(this.newPaymentDate!, -1);
      this.isFirstBaseIdentical = false;
    }

    this.newPaymentDate = JsDateUtils.addMonths(this.newPaymentDate!, 1);
    return this.newPaymentDate;
  }

  reset(): void {
    this.newPaymentDate = null;
    this.isInstalmentDateUpdate = false;
    this.isEarlyPayDateUpdate = false;
    this.isFirstBaseIdentical = true;
  }
}
