import {
  Component,
  computed,
  OnInit,
  OnDestroy,
  signal,
  ChangeDetectionStrategy,
  inject,
  input,
  linkedSignal,
  output,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePickerService } from './services/date-picker.service';

@Component({
  selector: 'date-picker',
  imports: [FormsModule],
  templateUrl: `./date-picker.component.html`,
  styleUrls: ['./date-picker.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:click)': 'onClickOutside($event)' },
})
export class DatePickerComponent implements OnInit, OnDestroy {
  private readonly datepickerService = inject(DatePickerService);
  readonly minDate = input<Date | null>(null);
  readonly maxDate = input<Date | null>(null);
  readonly initialDate = input<Date | null>(null);
  readonly datepickerId = input<string>(
    `datepicker-${Math.random().toString(36).substr(2, 9)}`,
  );
  readonly openSide = input<'left' | 'right'>('left');
  readonly firstDayOfWeek = input<0 | 1 | 2 | 3 | 4 | 5 | 6>(1); // Default to Monday

  readonly dateChange = output<Date>();

  readonly open = signal(false);
  readonly selectedDate = linkedSignal(() => this.getInitialDate());

  // Current view
  readonly selectedYear = linkedSignal(() => this.selectedDate().getFullYear());
  readonly selectedMonth = linkedSignal(() => this.selectedDate().getMonth());

  readonly today = new Date();

  // Original week days
  readonly weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  readonly monthShortNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];

  ngOnInit() {
    this.datepickerService.registerDatepicker(this.datepickerId(), () => {
      this.closeCalendar();
    });
  }

  ngOnDestroy() {
    this.datepickerService.unregisterDatepicker(this.datepickerId());
  }

  private getInitialDate(): Date {
    let initial: Date;

    const initialDate = this.initialDate();
    if (initialDate) {
      initial = new Date(initialDate);
    } else {
      initial = new Date();
    }

    const minDate = this.minDate();
    if (minDate && initial < minDate) {
      initial = new Date(minDate);
    }
    const maxDate = this.maxDate();
    if (maxDate && initial > maxDate) {
      initial = new Date(maxDate);
    }

    return initial;
  }

  readonly selectedDateValue = computed(() => {
    const d = this.selectedDate();

    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  });

  // Reorder week days based on firstDayOfWeek
  readonly reorderedWeekDays = computed((): string[] => {
    const weekDaysCopy = [...this.weekDays];
    const reordered = [];

    // Start from the specified first day of week
    for (let i = this.firstDayOfWeek(); i < weekDaysCopy.length; i++) {
      reordered.push(weekDaysCopy[i]);
    }
    for (let i = 0; i < this.firstDayOfWeek(); i++) {
      reordered.push(weekDaysCopy[i]);
    }

    return reordered;
  });

  // Available years based on min/max
  readonly availableYears = computed((): number[] => {
    const minDate = this.minDate();
    const minYear = minDate
      ? minDate.getFullYear()
      : this.today.getFullYear() - 10;
    const maxDate = this.maxDate();
    const maxYear = maxDate
      ? maxDate.getFullYear()
      : this.today.getFullYear() + 10;

    const years = [];
    for (let year = minYear; year <= maxYear; year++) {
      years.push(year);
    }
    return years;
  });

  // Available months for current year - FIXED
  readonly availableMonths = computed((): number[] => {
    const currentYear = this.selectedYear();
    const months = [];

    for (let month = 0; month < 12; month++) {
      const date = new Date(currentYear, month, 1);

      // Check if month is within min/max range
      const minDate = this.minDate();
      if (minDate && date < minDate) {
        const minYear = minDate.getFullYear();
        const minMonth = minDate.getMonth();
        if (
          currentYear < minYear ||
          (currentYear === minYear && month < minMonth)
        ) {
          continue;
        }
      }

      const maxDate = this.maxDate();
      if (maxDate && date > maxDate) {
        const maxYear = maxDate.getFullYear();
        const maxMonth = maxDate.getMonth();
        if (
          currentYear > maxYear ||
          (currentYear === maxYear && month > maxMonth)
        ) {
          continue;
        }
      }

      months.push(month);
    }

    return months.length > 0 ? months : [this.selectedMonth()];
  });

  onYearMonthChange() {
    const availableMonths = this.availableMonths();
    if (!availableMonths.includes(this.selectedMonth())) {
      this.selectedMonth.set(availableMonths[0] || 0);
    }
  }

  setSelectedYear(value: string | number) {
    this.selectedYear.set(Number(value));
    this.onYearMonthChange();
  }

  setSelectedMonth(value: string | number) {
    this.selectedMonth.set(Number(value));
    this.onYearMonthChange();
  }

  readonly emptyDays = computed((): number[] => {
    const firstDayOfMonth = new Date(
      this.selectedYear(),
      this.selectedMonth(),
      1,
    ).getDay(); // 0 = Sunday, 1 = Monday, etc.

    // Adjust for custom first day of week
    let emptyDaysCount = (firstDayOfMonth - this.firstDayOfWeek() + 7) % 7;

    return Array(emptyDaysCount).fill(0);
  });

  readonly daysInMonth = computed((): number[] => {
    const days = new Date(
      this.selectedYear(),
      this.selectedMonth() + 1,
      0,
    ).getDate();
    return Array.from({ length: days }, (_, i) => i + 1);
  });

  isSelected(day: number): boolean {
    const d = this.selectedDate();
    if (!d) return false;

    return (
      d.getDate() === day &&
      d.getMonth() === this.selectedMonth() &&
      d.getFullYear() === this.selectedYear()
    );
  }

  isToday(day: number): boolean {
    return (
      day === this.today.getDate() &&
      this.selectedMonth() === this.today.getMonth() &&
      this.selectedYear() === this.today.getFullYear()
    );
  }

  isDisabled(day: number): boolean {
    const date = new Date(this.selectedYear(), this.selectedMonth(), day);

    const minDate = this.minDate();
    if (minDate && date < minDate) {
      return true;
    }

    const maxDate = this.maxDate();
    if (maxDate && date > maxDate) {
      return true;
    }

    return false;
  }

  selectDate(day: number) {
    if (this.isDisabled(day)) {
      return;
    }

    const date = new Date(this.selectedYear(), this.selectedMonth(), day);
    date.setHours(0, 0, 0, 0);

    this.selectedDate.set(date);
    this.dateChange.emit(date);
    this.closeCalendar();
  }

  readonly canGoPrev = computed((): boolean => {
    const prevMonth =
      this.selectedMonth() === 0 ? 11 : this.selectedMonth() - 1;
    const prevYear =
      this.selectedMonth() === 0
        ? this.selectedYear() - 1
        : this.selectedYear();

    // Check if we can navigate to previous month based on min date
    const minDate = this.minDate();
    if (minDate) {
      const prevDate = new Date(prevYear, prevMonth, 1);
      return prevDate >= minDate;
    }

    return true;
  });

  readonly canGoNext = computed((): boolean => {
    const nextMonth =
      this.selectedMonth() === 11 ? 0 : this.selectedMonth() + 1;
    const nextYear =
      this.selectedMonth() === 11
        ? this.selectedYear() + 1
        : this.selectedYear();

    // Check if we can navigate to next month based on max date
    const maxDate = this.maxDate();
    if (maxDate) {
      const nextDate = new Date(nextYear, nextMonth, 1);
      return nextDate <= maxDate;
    }

    return true;
  });

  prevMonth() {
    if (!this.canGoPrev()) return;

    if (this.selectedMonth() === 0) {
      this.selectedMonth.set(11);
      this.selectedYear.update((year) => year - 1);
    } else {
      this.selectedMonth.update((month) => month - 1);
    }

    // Ensure month is in available months
    this.onYearMonthChange();
  }

  nextMonth() {
    if (!this.canGoNext()) return;

    if (this.selectedMonth() === 11) {
      this.selectedMonth.set(0);
      this.selectedYear.update((year) => year + 1);
    } else {
      this.selectedMonth.update((month) => month + 1);
    }

    // Ensure month is in available months
    this.onYearMonthChange();
  }

  getDayTitle(day: number): string {
    const date = new Date(this.selectedYear(), this.selectedMonth(), day);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  toggle() {
    if (this.open()) {
      this.closeCalendar();
    } else {
      this.openCalendar();
    }
  }

  openCalendar() {
    // Notify service to close other datepickers
    this.datepickerService.openDatepicker(this.datepickerId());
    this.open.set(true);
  }

  closeCalendar() {
    this.open.set(false);
    this.datepickerService.closeDatepicker(this.datepickerId());
  }

  onClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.datepicker') && this.open()) {
      this.closeCalendar();
    }
  }
}
