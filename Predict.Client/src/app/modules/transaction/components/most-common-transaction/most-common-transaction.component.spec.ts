import { describe, it } from 'vitest';
import { MostCommonTransactionComponent } from './most-common-transaction.component';
import { expectComponentCreation } from 'src/app/testing/component-test-setup';

describe('MostCommonTransactionComponent', () => {
  it('should create', () => {
    expectComponentCreation(MostCommonTransactionComponent);
  });
});
