import { describe, it } from 'vitest';
import { LoanInsightsComponent } from './loan-simulator-insights.component';
import { expectComponentCreation } from 'src/app/testing/component-test-setup';

describe('LoanInsightsComponent', () => {
  it('should create', () => {
    expectComponentCreation(LoanInsightsComponent);
  });
});
