import { describe, it } from 'vitest';
import { HistoricalInstalmentsTableComponent } from './historical-instalments-table.component';
import { expectComponentCreation } from 'src/app/testing/component-test-setup';

describe('HistoricalInstalmentsTableComponent', () => {
  it('should create', () => {
    expectComponentCreation(HistoricalInstalmentsTableComponent);
  });
});
