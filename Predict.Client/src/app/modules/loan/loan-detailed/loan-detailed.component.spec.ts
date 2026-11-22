import { describe, it } from 'vitest';
import { LoanDetailedComponent } from './loan-detailed.component';
import { expectComponentCreation } from 'src/app/testing/component-test-setup';

describe('LoanDetailedComponent', () => {
  it('should create', () => {
    expectComponentCreation(LoanDetailedComponent);
  });
});
