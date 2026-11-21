import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  linkedSignal,
} from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { DatePickerComponent } from '../date-picker/date-picker.component';
import { DateRangePicker } from './models/date-range-picker.model';

@Component({
  imports: [ReactiveFormsModule, DatePickerComponent],
  selector: 'p-date-range-picker',
  templateUrl: './date-range-picker.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./date-range-picker.component.scss'],
})
export class RangeSelectorComponent {
  readonly startDate = input.required<Date>();
  readonly endDate = input.required<Date>();
  readonly minDate = input.required<Date>();
  readonly maxDate = input.required<Date>();

  readonly valueChanged = output<DateRangePicker>();
  readonly currentStartDate = linkedSignal(() => this.startDate());
  readonly currentEndDate = linkedSignal(() => this.endDate());

  onStartDateChange(date: Date) {
    this.currentStartDate.set(date);
    this.emitChanges();
  }

  onEndDateChange(date: Date) {
    this.currentEndDate.set(date);
    this.emitChanges();
  }

  emitChanges() {
    this.valueChanged.emit({
      startDate: this.currentStartDate(),
      endDate: this.currentEndDate(),
    } as DateRangePicker);
  }
}
