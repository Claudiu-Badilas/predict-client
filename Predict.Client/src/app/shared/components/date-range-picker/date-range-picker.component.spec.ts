import { describe, expect, it } from 'vitest';
import { RangeSelectorComponent } from './date-range-picker.component';
import { expectComponentCreation } from 'src/app/testing/component-test-setup';

describe('RangeSelectorComponent', () => {
  it('should create', () => {
    expectComponentCreation(RangeSelectorComponent);
  });

  it('emits each updated range using the latest dates', () => {
    expectComponentCreation(RangeSelectorComponent, (fixture) => {
      const startDate = new Date(2024, 1, 1);
      const endDate = new Date(2024, 1, 29);
      const emitted: { startDate: Date; endDate: Date }[] = [];
      fixture.componentInstance.valueChanged.subscribe((range) =>
        emitted.push(range),
      );

      fixture.componentInstance.onStartDateChange(startDate);
      fixture.componentInstance.onEndDateChange(endDate);

      expect(emitted).toEqual([
        { startDate, endDate: new Date(2024, 0, 15) },
        { startDate, endDate },
      ]);
    });
  });
});
