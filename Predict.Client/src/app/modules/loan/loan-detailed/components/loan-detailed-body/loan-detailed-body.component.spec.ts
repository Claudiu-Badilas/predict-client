import { describe, it } from 'vitest';
import { LoanDetailedBodyComponent } from './loan-detailed-body.component';
import { expectComponentCreation } from 'src/app/testing/component-test-setup';

describe('LoanDetailedBodyComponent', () => {
  it('should create', () => {
    expectComponentCreation(LoanDetailedBodyComponent);
  });
});
