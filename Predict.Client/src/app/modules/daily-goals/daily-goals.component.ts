import { Component, signal } from '@angular/core';
import { TopBarComponent } from 'src/app/shared/components/top-bar/top-bar.component';
import { RangeSelectorComponent } from '../../shared/components/date-range-picker/date-range-picker.component';
import { DateRangePicker } from '../../shared/components/date-range-picker/models/date-range-picker.model';
import { ActivityCalendarComponent } from './components/activity-calendar/activity-calendar.component';
import type {
  ActivityCalendarConfig,
  ActivityContribution,
} from './components/activity-calendar/activity-calendar.component';

@Component({
  imports: [ActivityCalendarComponent, TopBarComponent, RangeSelectorComponent],
  selector: 'app-daily-goals',
  styleUrl: './daily-goals.component.scss',
  templateUrl: './daily-goals.component.html',
})
export class DailyGoalsComponent {
  readonly activityCalendarConfig: ActivityCalendarConfig = {
    colorOptions: [
      {
        id: 'planned',
        label: 'Planned',
        color: '#a9c7ed',
        darkColor: '#426f9f',
      },
      {
        id: 'in-progress',
        label: 'In progress',
        color: '#f0d39b',
        darkColor: '#8e6c35',
      },
      {
        id: 'complete',
        label: 'Complete',
        color: '#a9d4b7',
        darkColor: '#347653',
      },
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
  readonly mockContributions = signal(
    this.createMockContributions(this.fromDate(), this.toDate()),
  );

  onDateRangeChange(range: DateRangePicker): void {
    this.fromDate.set(range.startDate);
    this.toDate.set(range.endDate);
    this.mockContributions.set(
      this.createMockContributions(range.startDate, range.endDate),
    );
  }

  private createMockContributions(
    fromDate: Date,
    toDate: Date,
  ): ActivityContribution[] {
    const contributions: ActivityContribution[] = [];
    const date = new Date(
      fromDate.getFullYear(),
      fromDate.getMonth(),
      fromDate.getDate(),
    );
    const lastDate = new Date(
      toDate.getFullYear(),
      toDate.getMonth(),
      toDate.getDate(),
    );
    while (date <= lastDate) {
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      const colorOptions = this.activityCalendarConfig.colorOptions;
      const colorOption =
        colorOptions.length > 0 && Math.random() < (isWeekend ? 0.2 : 0.6)
          ? colorOptions[Math.floor(Math.random() * colorOptions.length)]
          : undefined;

      if (colorOption) {
        contributions.push({
          date: new Date(date),
          count: 1,
          colorId: colorOption.id,
        });
      }

      date.setDate(date.getDate() + 1);
    }

    return contributions;
  }
}
