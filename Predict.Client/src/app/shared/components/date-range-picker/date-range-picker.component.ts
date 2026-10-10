import {
  Component,
  EventEmitter,
  Input,
  Output,
  ChangeDetectionStrategy,
} from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { DatePickerComponent } from '../date-picker/date-picker.component';
import { DateRangePicker } from './models/date-range-picker.model';

@Component({
  imports: [ReactiveFormsModule, DatePickerComponent],
  selector: 'p-date-range-picker',
  templateUrl: './date-range-picker.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./date-range-picker.component.scss'],
})
export class RangeSelectorComponent {
  @Input({ required: true }) startDate: Date;
  @Input({ required: true }) endDate: Date;
  @Input({ required: true }) minDate: Date;
  @Input({ required: true }) maxDate: Date;

  @Output() valueChanged = new EventEmitter<DateRangePicker>();

  onStartDateChange(date: Date) {
    this.startDate = date;
    this.emitChanges();
  }

  onEndDateChange(date: Date) {
    this.endDate = date;
    this.emitChanges();
  }

  emitChanges() {
    this.valueChanged.emit({
      startDate: this.startDate,
      endDate: this.endDate,
    } as DateRangePicker);
  }
}
