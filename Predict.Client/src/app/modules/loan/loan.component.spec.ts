import { describe, it } from 'vitest';
import { LoanComponent } from './loan.component';
import { expectComponentCreation } from 'src/app/testing/component-test-setup';

describe('LoanComponent', () => {
  it('should create', () => {
    expectComponentCreation(LoanComponent);
  });
});
