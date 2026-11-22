import { describe, it } from 'vitest';
import { RangeSelectorComponent } from './date-range-picker.component';
import { expectComponentCreation } from 'src/app/testing/component-test-setup';

describe('RangeSelectorComponent', () => {
  it('should create', () => {
    expectComponentCreation(RangeSelectorComponent);
  });
});
