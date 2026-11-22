import { describe, it } from 'vitest';
import { SearchInputComponent } from './search-input.component';
import { expectComponentCreation } from 'src/app/testing/component-test-setup';

describe('SearchInputComponent', () => {
  it('should create', () => {
    expectComponentCreation(SearchInputComponent);
  });
});
