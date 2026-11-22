import { describe, it } from 'vitest';
import { LoanSimulatorHeaderComponent } from './loan-simulator-header.component';
import { expectComponentCreation } from 'src/app/testing/component-test-setup';

describe('LoanSimulatorHeaderComponent', () => {
  it('should create', () => {
    expectComponentCreation(LoanSimulatorHeaderComponent);
  });
});
