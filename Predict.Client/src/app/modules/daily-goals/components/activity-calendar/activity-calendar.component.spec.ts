import { describe, it } from 'vitest';
import { ActivityCalendarComponent } from './activity-calendar.component';
import { expectComponentCreation } from 'src/app/testing/component-test-setup';

describe('ActivityCalendarComponent', () => {
  it('should create', () => {
    expectComponentCreation(ActivityCalendarComponent);
  });
});
