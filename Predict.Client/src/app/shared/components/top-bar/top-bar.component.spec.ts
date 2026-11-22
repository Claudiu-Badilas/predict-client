import { describe, it } from 'vitest';
import { TopBarComponent } from './top-bar.component';
import { expectComponentCreation } from 'src/app/testing/component-test-setup';

describe('TopBarComponent', () => {
  it('should create', () => {
    expectComponentCreation(TopBarComponent);
  });
});
