import { describe, it } from 'vitest';
import { NumericInputComponent } from './numeric-input.component';
import { expectComponentCreation } from 'src/app/testing/component-test-setup';

describe('NumericInputComponent', () => {
  it('should create', () => {
    expectComponentCreation(NumericInputComponent);
  });
});
