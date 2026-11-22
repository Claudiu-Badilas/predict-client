import { describe, it } from 'vitest';
import { TransactionInsightsComponent } from './transaction-insights.component';
import { expectComponentCreation } from 'src/app/testing/component-test-setup';

describe('TransactionInsightsComponent', () => {
  it('should create', () => {
    expectComponentCreation(TransactionInsightsComponent);
  });
});
