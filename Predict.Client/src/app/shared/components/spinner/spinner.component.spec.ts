import { describe, it } from 'vitest';
import { SpinnerComponent } from './spinner.component';
import { expectComponentCreation } from 'src/app/testing/component-test-setup';

describe('SpinnerComponent', () => {
  it('should create', () => {
    expectComponentCreation(SpinnerComponent);
  });
});
