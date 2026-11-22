import { TestBed } from '@angular/core/testing';
import { ThemeService } from 'src/app/core/services/theme.service';
import { describe, expect, it } from 'vitest';
import { ActivityCalendarComponent } from './activity-calendar.component';
import { expectComponentCreation } from 'src/app/testing/component-test-setup';

describe('ActivityCalendarComponent', () => {
  it('should create', () => {
    expectComponentCreation(ActivityCalendarComponent);
  });

  it('builds week data and cycles valid color choices for days in range', () => {
    expectComponentCreation(ActivityCalendarComponent, (fixture) => {
      const component = fixture.componentInstance;
      const theme = TestBed.inject(ThemeService) as unknown as {
        theme: { set(value: 'light' | 'dim' | 'dark'): void };
      };
      const colors = [
        { id: 'default', label: 'Default', color: '#eeeeee' },
        { id: 'blue', label: 'Blue', color: '#3366ff', darkColor: '#6699ff' },
        { id: 'green', label: 'Green', color: '#33aa55' },
      ];
      fixture.componentRef.setInput('config', { colorOptions: colors });
      fixture.componentRef.setInput('fromDate', new Date(2024, 11, 31));
      fixture.componentRef.setInput('toDate', new Date(2025, 0, 6));
      fixture.componentRef.setInput('contributions', [
        { date: '2024-12-31', count: 4, colorId: 'blue' },
        { date: new Date(2025, 0, 1), count: 2, colorId: 'unknown' },
        { date: '2025-01-02', count: 1, colorId: 'default' },
        { date: 'invalid', count: 1, colorId: 'blue' },
      ]);
      fixture.detectChanges();

      expect(component.colorOptions()).toEqual([
        { id: 'default', label: 'Default', color: '#ebedf0' },
        colors[1],
        colors[2],
      ]);
      expect(component.availableDays()).toBe(7);
      expect(component.daysWithStatus()).toBe(1);
      expect(component.getSelectedColorId(new Date(2024, 11, 31))).toBe('blue');
      expect(component.getCustomColor(new Date(2024, 11, 31))).toBe('#3366ff');
      expect(component.getCustomColor(new Date(2025, 0, 1))).toBeNull();
      expect(
        component.getDayAccessibleLabel({
          label: 'Tuesday, Dec 31',
          date: new Date(),
          count: 1,
          level: 4,
          inRange: true,
        }),
      ).toBe('Tuesday, Dec 31');
      expect(component.getColorOptionColor(colors[1])).toBe('#3366ff');
      theme.theme.set('dark');
      expect(component.getColorOptionColor(colors[1])).toBe('#6699ff');
      expect(component.getColorOptionColor(colors[2])).toBe('#33aa55');

      const date = new Date(2024, 11, 31);
      component.setDayColor(date, colors[2]);
      component.weeks();
      expect(component.getSelectedColorId(date)).toBe('green');
      component.setDayColor(date, {
        id: 'missing',
        label: 'Missing',
        color: 'red',
      });
      expect(component.getSelectedColorId(date)).toBe('green');
      component.cycleDayColor(date, false);
      expect(component.getSelectedColorId(date)).toBe('green');
      component.cycleDayColor(date, true);
      expect(component.getSelectedColorId(date)).toBe('default');
      expect(component.getCustomColor(date)).toBe('#eeeeee');
      component.cycleDayColor(date, true);
      expect(component.getSelectedColorId(date)).toBe('blue');
      component.clearDayColor(date);
      expect(component.getSelectedColorId(date)).toBe('default');
      component.selectedColorIds.set({ '2025-01-03': 'unknown' });
      component.weeks();
      const unmarkedDate = new Date(2025, 0, 4);
      component.cycleDayColor(unmarkedDate, true);
      expect(component.getSelectedColorId(unmarkedDate)).toBe('blue');

      expect(component.weeks().some((week) => week.yearLabel === '2024')).toBe(
        true,
      );
      expect(component.weeks().some((week) => week.yearLabel === '2025')).toBe(
        true,
      );
    });
  });
});
