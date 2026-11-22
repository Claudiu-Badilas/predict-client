import { describe, it } from 'vitest';
import { TransactionComponent } from './transaction.component';
import { expectComponentCreation } from 'src/app/testing/component-test-setup';

describe('TransactionComponent', () => {
  it('should create', () => {
    expectComponentCreation(TransactionComponent);
  });
});
