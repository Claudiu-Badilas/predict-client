import { Component, signal } from '@angular/core';
import { TopBarComponent } from 'src/app/shared/components/top-bar/top-bar.component';
import { RangeSelectorComponent } from '../../shared/components/date-range-picker/date-range-picker.component';
import { DateRangePicker } from '../../shared/components/date-range-picker/models/date-range-picker.model';
import { ActivityCalendarComponent } from './components/activity-calendar/activity-calendar.component';
import type { ActivityCalendarConfig } from './components/activity-calendar/activity-calendar.component';

@Component({
  imports: [ActivityCalendarComponent, TopBarComponent, RangeSelectorComponent],
  selector: 'app-daily-goals',
  styleUrl: './daily-goals.component.scss',
  templateUrl: './daily-goals.component.html',
})
export class DailyGoalsComponent {
  readonly activityCalendarConfig: ActivityCalendarConfig = {
    colorOptions: [
      { id: 'planned', label: 'Planned', color: '#60a5fa' },
      { id: 'in-progress', label: 'In progress', color: '#fbbf24' },
      { id: 'complete', label: 'Complete', color: '#34d399' },
    ],
  };
  private readonly today = new Date();
  readonly fromDate = signal(
    new Date(
      this.today.getFullYear() - 1,
      this.today.getMonth(),
      this.today.getDate(),
    ),
  );
  readonly toDate = signal(new Date(this.today));
  readonly minDate = new Date(this.today.getFullYear() - 10, 0, 1);
  readonly maxDate = new Date(this.today);

  onDateRangeChange(range: DateRangePicker): void {
    this.fromDate.set(range.startDate);
    this.toDate.set(range.endDate);
  }
}
