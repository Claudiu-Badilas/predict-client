import { TestBed } from '@angular/core/testing';
import { DatePickerService } from './services/date-picker.service';
import { describe, expect, it, vi } from 'vitest';
import { DatePickerComponent } from './date-picker.component';
import { expectComponentCreation } from 'src/app/testing/component-test-setup';

describe('DatePickerComponent', () => {
  it('should create', () => {
    expectComponentCreation(DatePickerComponent);
  });

  it('clamps dates, navigates month limits, and emits only valid selections', () => {
    expectComponentCreation(DatePickerComponent, (fixture) => {
      const component = fixture.componentInstance;
      const service = TestBed.inject(DatePickerService) as unknown as {
        registerDatepicker: (id: string, close: () => void) => void;
        openDatepicker: (id: string) => void;
        closeDatepicker: (id: string) => void;
      };
      const registerDatepicker = vi.spyOn(service, 'registerDatepicker');
      const openDatepicker = vi.spyOn(service, 'openDatepicker');
      const closeDatepicker = vi.spyOn(service, 'closeDatepicker');
      const dates: Date[] = [];
      component.dateChange.subscribe((date) => dates.push(date));

      fixture.componentRef.setInput('minDate', new Date(2024, 2, 15));
      fixture.componentRef.setInput('maxDate', new Date(2024, 10, 30));
      fixture.componentRef.setInput('initialDate', new Date(2025, 0, 1));
      fixture.detectChanges();
      expect(component.selectedDate()).toEqual(new Date(2024, 10, 30));
      fixture.componentRef.setInput('initialDate', new Date(2023, 11, 1));
      fixture.detectChanges();
      expect(component.selectedDate()).toEqual(new Date(2024, 2, 15));
      expect(component.selectedDateValue()).toBe('15-03-2024');
      expect(component.availableMonths()).toEqual([2, 3, 4, 5, 6, 7, 8, 9, 10]);
      expect(component.availableYears()).toEqual([2024]);
      fixture.componentRef.setInput('maxDate', new Date(2024, 9, 15));
      fixture.detectChanges();
      expect(component.availableMonths()).toEqual([2, 3, 4, 5, 6, 7, 8, 9]);
      fixture.componentRef.setInput('maxDate', new Date(2024, 10, 30));
      fixture.detectChanges();
      expect(component.daysInMonth()).toHaveLength(31);
      expect(component.emptyDays()).toHaveLength(4);
      expect(component.isSelected(15)).toBe(true);
      expect(component.isSelected(14)).toBe(false);
      expect(component.isToday(15)).toBe(false);
      expect(component.isDisabled(14)).toBe(true);
      expect(component.isDisabled(21)).toBe(false);
      expect(component.getDayTitle(15)).toBe('Friday, March 15, 2024');
      const registrationCallback = registerDatepicker.mock.calls[0][1];
      registrationCallback();
      expect(component.open()).toBe(false);
      component.selectedDate.set(null as unknown as Date);
      expect(component.isSelected(15)).toBe(false);
      fixture.componentRef.setInput('initialDate', new Date(2024, 2, 15));
      fixture.detectChanges();
      fixture.componentRef.setInput('maxDate', new Date(2024, 2, 17));
      fixture.detectChanges();
      expect(component.isDisabled(21)).toBe(true);
      fixture.componentRef.setInput('maxDate', new Date(2024, 10, 30));
      fixture.detectChanges();

      component.setSelectedMonth(0);
      expect(component.selectedMonth()).toBe(2);
      component.setSelectedYear(2023);
      expect(component.availableMonths()).toEqual([2]);
      component.setSelectedYear(2024);
      expect(component.selectedYear()).toBe(2024);

      component.prevMonth();
      expect(component.selectedMonth()).toBe(2);
      fixture.componentRef.setInput('minDate', new Date(2023, 11, 1));
      fixture.detectChanges();
      component.setSelectedMonth(0);
      component.prevMonth();
      expect(component.selectedYear()).toBe(2023);
      expect(component.selectedMonth()).toBe(11);
      component.nextMonth();
      expect(component.selectedYear()).toBe(2024);
      expect(component.selectedMonth()).toBe(0);
      component.nextMonth();
      expect(component.selectedMonth()).toBe(1);
      component.prevMonth();
      expect(component.selectedMonth()).toBe(0);

      fixture.componentRef.setInput('minDate', null);
      fixture.componentRef.setInput('maxDate', new Date(2025, 1, 1));
      fixture.componentRef.setInput('initialDate', new Date(2024, 0, 15));
      fixture.detectChanges();
      component.setSelectedYear(2024);
      component.setSelectedMonth(11);
      expect(component.canGoNext()).toBe(true);
      component.nextMonth();
      expect(component.selectedYear()).toBe(2025);
      expect(component.selectedMonth()).toBe(0);
      fixture.componentRef.setInput('maxDate', new Date(2024, 11, 31));
      fixture.detectChanges();
      component.setSelectedYear(2024);
      component.setSelectedMonth(11);
      component.nextMonth();
      expect(component.selectedYear()).toBe(2024);
      expect(component.selectedMonth()).toBe(11);

      fixture.componentRef.setInput('minDate', new Date(2024, 2, 15));
      fixture.componentRef.setInput('maxDate', new Date(2024, 10, 30));
      fixture.componentRef.setInput('initialDate', new Date(2024, 2, 15));
      fixture.detectChanges();
      component.openCalendar();
      expect(component.open()).toBe(true);
      expect(openDatepicker).toHaveBeenCalledWith(component.datepickerId());
      component.selectDate(14);
      expect(dates).toEqual([]);
      component.selectDate(18);
      expect(dates).toEqual([new Date(2024, 2, 18)]);
      expect(dates[0].getHours()).toBe(0);
      expect(component.open()).toBe(false);
      expect(closeDatepicker).toHaveBeenCalled();

      component.toggle();
      expect(component.open()).toBe(true);
      component.toggle();
      expect(component.open()).toBe(false);
      component.openCalendar();
      const inside = document.createElement('div');
      inside.className = 'datepicker';
      component.onClickOutside({ target: inside } as unknown as MouseEvent);
      expect(component.open()).toBe(true);
      component.onClickOutside({
        target: document.body,
      } as unknown as MouseEvent);
      expect(component.open()).toBe(false);
      component.onClickOutside({
        target: document.body,
      } as unknown as MouseEvent);
      expect(component.open()).toBe(false);

      component.setSelectedYear(component.today.getFullYear());
      component.setSelectedMonth(component.today.getMonth());
      expect(component.isToday(component.today.getDate())).toBe(true);
    });
  });

  it('supports unbounded calendars and wraps week days from a custom start', () => {
    expectComponentCreation(DatePickerComponent, (fixture) => {
      const component = fixture.componentInstance;
      fixture.componentRef.setInput('minDate', null);
      fixture.componentRef.setInput('maxDate', null);
      fixture.componentRef.setInput('firstDayOfWeek', 0);
      fixture.detectChanges();

      const year = component.today.getFullYear();
      expect(component.availableYears()).toEqual(
        Array.from({ length: 21 }, (_, index) => year - 10 + index),
      );
      expect(component.availableMonths()).toHaveLength(12);
      expect(component.reorderedWeekDays()).toEqual([
        'Su',
        'Mo',
        'Tu',
        'We',
        'Th',
        'Fr',
        'Sa',
      ]);
      expect(component.canGoPrev()).toBe(true);
      expect(component.canGoNext()).toBe(true);
      component.setSelectedYear(2024);
      component.setSelectedMonth(1);
      expect(component.daysInMonth()).toHaveLength(29);
      expect(component.emptyDays()).toHaveLength(4);
    });
  });
});
