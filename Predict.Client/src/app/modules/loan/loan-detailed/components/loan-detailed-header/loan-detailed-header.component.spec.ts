import { describe, it } from 'vitest';
import { LoanDetailedHeaderComponent } from './loan-detailed-header.component';
import { expectComponentCreation } from 'src/app/testing/component-test-setup';

describe('LoanDetailedHeaderComponent', () => {
  it('should create', () => {
    expectComponentCreation(LoanDetailedHeaderComponent);
  });
});
