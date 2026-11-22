import { describe, it } from 'vitest';
import { ReceiptInsightsComponent } from './receipt-insights.component';
import { expectComponentCreation } from 'src/app/testing/component-test-setup';

describe('ReceiptInsightsComponent', () => {
  it('should create', () => {
    expectComponentCreation(ReceiptInsightsComponent);
  });
});
