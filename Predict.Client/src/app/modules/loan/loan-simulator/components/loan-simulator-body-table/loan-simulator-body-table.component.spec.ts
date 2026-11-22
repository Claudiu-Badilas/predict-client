import { describe, it } from 'vitest';
import { LoanSimulatorBodyTableComponent } from './loan-simulator-body-table.component';
import { expectComponentCreation } from 'src/app/testing/component-test-setup';

describe('LoanSimulatorBodyTableComponent', () => {
  it('should create', () => {
    expectComponentCreation(LoanSimulatorBodyTableComponent);
  });
});
