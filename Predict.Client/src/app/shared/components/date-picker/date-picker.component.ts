import { DOCUMENT } from '@angular/common';
import {
  Component,
  EventEmitter,
  HostListener,
  Inject,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  signal,
  SimpleChanges,
  ChangeDetectionStrategy,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePickerService } from './services/date-picker.service';

const datepickerService = new DatePickerService();

@Component({
  selector: 'date-picker',
  imports: [FormsModule],
  templateUrl: `./date-picker.component.html`,
  styleUrls: ['./date-picker.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  providers: [DatePickerService],
})
export class DatePickerComponent implements OnInit, OnChanges, OnDestroy {
  @Input() minDate: Date | null = null;
  @Input() maxDate: Date | null = null;
  @Input() initialDate: Date | null = null;
  @Input() datepickerId: string = `datepicker-${Math.random()
    .toString(36)
    .substr(2, 9)}`;
  @Input() openSide: 'left' | 'right' = 'left';
  @Input() firstDayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6 = 1; // Default to Monday

  @Output() dateChange = new EventEmitter<Date>();

  open = signal(false);
  selectedDate = signal<Date | null>(null);

  // Current view
  selectedYear = new Date().getFullYear();
  selectedMonth = new Date().getMonth();

  today = new Date();

  // Original week days
  weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  monthShortNames = [
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

  constructor(@Inject(DOCUMENT) private document: Document) {}

  ngOnInit() {
    this.initializeDate();
    datepickerService.registerDatepicker(this.datepickerId, () => {
      this.closeCalendar();
    });
  }

  ngOnDestroy() {
    datepickerService.unregisterDatepicker(this.datepickerId);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (
      changes['minDate'] ||
      changes['maxDate'] ||
      changes['initialDate'] ||
      changes['firstDayOfWeek']
    ) {
      this.initializeDate();
    }
  }

  private initializeDate() {
    let initial: Date;

    if (this.initialDate) {
      initial = new Date(this.initialDate);
    } else {
      initial = new Date();
    }

    if (this.minDate && initial < this.minDate) {
      initial = new Date(this.minDate);
    }
    if (this.maxDate && initial > this.maxDate) {
      initial = new Date(this.maxDate);
    }

    this.selectedDate.set(initial);
    this.selectedYear = initial.getFullYear();
    this.selectedMonth = initial.getMonth();
  }

  get selectedDateValue(): string {
    const d = this.selectedDate();
    if (!d) return '';

    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  }

  // Reorder week days based on firstDayOfWeek
  reorderedWeekDays(): string[] {
    const weekDaysCopy = [...this.weekDays];
    const reordered = [];

    // Start from the specified first day of week
    for (let i = this.firstDayOfWeek; i < weekDaysCopy.length; i++) {
      reordered.push(weekDaysCopy[i]);
    }
    for (let i = 0; i < this.firstDayOfWeek; i++) {
      reordered.push(weekDaysCopy[i]);
    }

    return reordered;
  }

  // Available years based on min/max
  availableYears(): number[] {
    const minYear = this.minDate
      ? this.minDate.getFullYear()
      : this.today.getFullYear() - 10;
    const maxYear = this.maxDate
      ? this.maxDate.getFullYear()
      : this.today.getFullYear() + 10;

    const years = [];
    for (let year = minYear; year <= maxYear; year++) {
      years.push(year);
    }
    return years;
  }

  // Available months for current year - FIXED
  availableMonths(): number[] {
    const currentYear = this.selectedYear;
    const months = [];

    for (let month = 0; month < 12; month++) {
      const date = new Date(currentYear, month, 1);

      // Check if month is within min/max range
      if (this.minDate && date < this.minDate) {
        const minYear = this.minDate.getFullYear();
        const minMonth = this.minDate.getMonth();
        if (
          currentYear < minYear ||
          (currentYear === minYear && month < minMonth)
        ) {
          continue;
        }
      }

      if (this.maxDate && date > this.maxDate) {
        const maxYear = this.maxDate.getFullYear();
        const maxMonth = this.maxDate.getMonth();
        if (
          currentYear > maxYear ||
          (currentYear === maxYear && month > maxMonth)
        ) {
          continue;
        }
      }

      months.push(month);
    }

    return months.length > 0 ? months : [this.selectedMonth];
  }

  onYearMonthChange() {
    const availableMonths = this.availableMonths();
    if (!availableMonths.includes(+this.selectedMonth)) {
      this.selectedMonth = availableMonths[0] || 0;
    }
  }

  getEmptyDays(): number[] {
    const firstDayOfMonth = new Date(
      this.selectedYear,
      this.selectedMonth,
      1,
    ).getDay(); // 0 = Sunday, 1 = Monday, etc.

    // Adjust for custom first day of week
    let emptyDaysCount = (firstDayOfMonth - this.firstDayOfWeek + 7) % 7;

    return Array(emptyDaysCount).fill(0);
  }

  daysInMonth(): number[] {
    const days = new Date(
      this.selectedYear,
      this.selectedMonth + 1,
      0,
    ).getDate();
    return Array.from({ length: days }, (_, i) => i + 1);
  }

  isSelected(day: number): boolean {
    const d = this.selectedDate();
    if (!d) return false;

    return (
      d.getDate() === day &&
      d.getMonth() === this.selectedMonth &&
      d.getFullYear() === this.selectedYear
    );
  }

  isToday(day: number): boolean {
    return (
      day === this.today.getDate() &&
      this.selectedMonth === this.today.getMonth() &&
      this.selectedYear === this.today.getFullYear()
    );
  }

  isDisabled(day: number): boolean {
    const date = new Date(this.selectedYear, this.selectedMonth, day);

    if (this.minDate && date < this.minDate) {
      return true;
    }

    if (this.maxDate && date > this.maxDate) {
      return true;
    }

    return false;
  }

  selectDate(day: number) {
    if (this.isDisabled(day)) {
      return;
    }

    const date = new Date(this.selectedYear, this.selectedMonth, day);
    date.setHours(0, 0, 0, 0);

    this.selectedDate.set(date);
    this.dateChange.emit(date);
    this.closeCalendar();
  }

  canGoPrev(): boolean {
    const prevMonth = this.selectedMonth === 0 ? 11 : this.selectedMonth - 1;
    const prevYear =
      this.selectedMonth === 0 ? this.selectedYear - 1 : this.selectedYear;

    // Check if we can navigate to previous month based on min date
    if (this.minDate) {
      const prevDate = new Date(prevYear, prevMonth, 1);
      return prevDate >= this.minDate;
    }

    return true;
  }

  canGoNext(): boolean {
    const nextMonth = this.selectedMonth === 11 ? 0 : this.selectedMonth + 1;
    const nextYear =
      this.selectedMonth === 11 ? this.selectedYear + 1 : this.selectedYear;

    // Check if we can navigate to next month based on max date
    if (this.maxDate) {
      const nextDate = new Date(nextYear, nextMonth, 1);
      return nextDate <= this.maxDate;
    }

    return true;
  }

  prevMonth() {
    if (!this.canGoPrev()) return;

    if (this.selectedMonth === 0) {
      this.selectedMonth = 11;
      this.selectedYear--;
    } else {
      this.selectedMonth--;
    }

    // Ensure month is in available months
    this.onYearMonthChange();
  }

  nextMonth() {
    if (!this.canGoNext()) return;

    if (this.selectedMonth === 11) {
      this.selectedMonth = 0;
      this.selectedYear++;
    } else {
      this.selectedMonth++;
    }

    // Ensure month is in available months
    this.onYearMonthChange();
  }

  getDayTitle(day: number): string {
    const date = new Date(this.selectedYear, this.selectedMonth, day);
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
    datepickerService.openDatepicker(this.datepickerId);
    this.open.set(true);
  }

  closeCalendar() {
    this.open.set(false);
    datepickerService.closeDatepicker(this.datepickerId);
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.datepicker') && this.open()) {
      this.closeCalendar();
    }
  }
}
