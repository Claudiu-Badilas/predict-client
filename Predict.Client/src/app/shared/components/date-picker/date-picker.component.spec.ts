import { describe, it } from 'vitest';
import { DatePickerComponent } from './date-picker.component';
import { expectComponentCreation } from 'src/app/testing/component-test-setup';

describe('DatePickerComponent', () => {
  it('should create', () => {
    expectComponentCreation(DatePickerComponent);
  });
});
