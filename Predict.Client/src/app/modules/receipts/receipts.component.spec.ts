import { describe, it } from 'vitest';
import { ReceiptsComponent } from './receipts.component';
import { expectComponentCreation } from 'src/app/testing/component-test-setup';

describe('ReceiptsComponent', () => {
  it('should create', () => {
    expectComponentCreation(ReceiptsComponent);
  });
});
