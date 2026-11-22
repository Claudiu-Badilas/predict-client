import { describe, it } from 'vitest';
import { DailyGoalsComponent } from './daily-goals.component';
import { expectComponentCreation } from 'src/app/testing/component-test-setup';

describe('DailyGoalsComponent', () => {
  it('should create', () => {
    expectComponentCreation(DailyGoalsComponent);
  });
});
