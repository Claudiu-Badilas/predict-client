import { describe, it } from 'vitest';
import { TransactionsSettingsComponent } from './transaction-settings.component';
import { expectComponentCreation } from 'src/app/testing/component-test-setup';

describe('TransactionsSettingsComponent', () => {
  it('should create', () => {
    expectComponentCreation(TransactionsSettingsComponent);
  });
});
