import { describe, it } from 'vitest';
import { PlatformToggleComponent } from './platform-toggle.component';
import { expectComponentCreation } from 'src/app/testing/component-test-setup';

describe('PlatformToggleComponent', () => {
  it('should create', () => {
    expectComponentCreation(PlatformToggleComponent);
  });
});
