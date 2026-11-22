import { describe, expect, it } from 'vitest';
import { DateStateManager } from './date-state-manager.service';

describe('DateStateManager', () => {
  it('starts a payment timeline at the selected instalment date', () => {
    const manager = new DateStateManager();
    const paymentDate = new Date(2024, 0, 15);

    manager.updateForInstalment(true);

    expect(manager.calculateNewPaymentDate(paymentDate, true, false)).toEqual(
      paymentDate,
    );
  });

  it('clears timeline state when reset', () => {
    const manager = new DateStateManager();
    manager.updateForInstalment(true);
    manager.calculateNewPaymentDate(new Date(2024, 0, 15), true, false);

    manager.reset();

    expect(
      manager.calculateNewPaymentDate(new Date(2024, 1, 15), false, false),
    ).toBeNull();
  });
});
