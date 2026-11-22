import { describe, it } from 'vitest';
import { LoanSimulatorComponent } from './loan-simulator.component';
import { expectComponentCreation } from 'src/app/testing/component-test-setup';

describe('LoanSimulatorComponent', () => {
  it('should create', () => {
    expectComponentCreation(LoanSimulatorComponent);
  });
});
