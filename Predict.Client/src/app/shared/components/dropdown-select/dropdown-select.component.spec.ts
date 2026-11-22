import { describe, it } from 'vitest';
import { DropdownSelectComponent } from './dropdown-select.component';
import { expectComponentCreation } from 'src/app/testing/component-test-setup';

describe('DropdownSelectComponent', () => {
  it('should create', () => {
    expectComponentCreation(DropdownSelectComponent);
  });
});
