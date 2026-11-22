import { describe, it } from 'vitest';
import { TransactionFeedComponent } from './transaction-feed.component';
import { expectComponentCreation } from 'src/app/testing/component-test-setup';

describe('TransactionFeedComponent', () => {
  it('should create', () => {
    expectComponentCreation(TransactionFeedComponent);
  });
});
