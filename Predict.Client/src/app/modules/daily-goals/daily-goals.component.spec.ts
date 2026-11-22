import { describe, expect, it, vi } from 'vitest';
import { DailyGoalsComponent } from './daily-goals.component';
import { expectComponentCreation } from 'src/app/testing/component-test-setup';

describe('DailyGoalsComponent', () => {
  it('should create', () => {
    expectComponentCreation(DailyGoalsComponent);
  }, 15000);

  it('updates the date range and generates contributions for the new days', () => {
    expectComponentCreation(DailyGoalsComponent, (fixture) => {
      const component = fixture.componentInstance;
      const random = vi.spyOn(Math, 'random').mockReturnValue(0);
      const fromDate = new Date(2024, 0, 6);
      const toDate = new Date(2024, 0, 8);

      component.onDateRangeChange({ startDate: fromDate, endDate: toDate });

      expect(component.fromDate()).toEqual(fromDate);
      expect(component.toDate()).toEqual(toDate);
      expect(component.mockContributions()).toHaveLength(3);
      expect(component.mockContributions().map(({ date }) => date)).toEqual([
        fromDate,
        new Date(2024, 0, 7),
        toDate,
      ]);
      random.mockRestore();
    });
  });
});
