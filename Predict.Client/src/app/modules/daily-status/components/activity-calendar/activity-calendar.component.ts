import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, input } from '@angular/core';

export interface ActivityContribution {
  date: Date | string;
  count: number;
}

interface CalendarDay {
  date: Date;
  count: number;
  level: number;
  label: string;
  inRange: boolean;
}

interface CalendarWeek {
  monthLabel: string;
  days: CalendarDay[];
}

@Component({
  selector: 'p-activity-calendar',
  imports: [DatePipe, DecimalPipe],
  templateUrl: './activity-calendar.component.html',
  styleUrl: './activity-calendar.component.scss',
})
export class ActivityCalendarComponent {
  contributions = input<ActivityContribution[]>([]);
  fromDate = input.required<Date>();
  toDate = input.required<Date>();
  emptyColor = input('#ebedf0');

  readonly weeks = computed(() => this.buildWeeks());
  readonly total = computed(() =>
    this.weeks()
      .flatMap((week) => week.days)
      .reduce((sum, day) => sum + (day.inRange ? day.count : 0), 0),
  );

  private buildWeeks(): CalendarWeek[] {
    const fromDate = this.toLocalDate(this.fromDate());
    const toDate = this.toLocalDate(this.toDate());
    const firstSunday = new Date(fromDate);
    firstSunday.setDate(firstSunday.getDate() - firstSunday.getDay());
    const lastSunday = new Date(toDate);
    lastSunday.setDate(lastSunday.getDate() - lastSunday.getDay());

    const counts = new Map<string, number>();
    for (const contribution of this.contributions()) {
      const date = this.toLocalDate(contribution.date);
      const key = this.dateKey(date);
      counts.set(key, (counts.get(key) ?? 0) + Math.max(0, contribution.count));
    }

    const maxCount = Array.from(counts.entries())
      .filter(([key]) => {
        const date = this.toLocalDate(key);
        return date >= fromDate && date <= toDate;
      })
      .reduce((max, [, count]) => Math.max(max, count), 0);
    const weeks: CalendarWeek[] = [];
    let previousMonth = -1;
    const weekCount =
      Math.floor(
        (Date.UTC(
          lastSunday.getFullYear(),
          lastSunday.getMonth(),
          lastSunday.getDate(),
        ) -
          Date.UTC(
            firstSunday.getFullYear(),
            firstSunday.getMonth(),
            firstSunday.getDate(),
          )) /
          (7 * 24 * 60 * 60 * 1000),
      ) + 1;

    for (let weekIndex = 0; weekIndex < weekCount; weekIndex++) {
      const weekStart = new Date(firstSunday);
      weekStart.setDate(firstSunday.getDate() + weekIndex * 7);
      const month = weekStart.getMonth();
      const week: CalendarWeek = {
        monthLabel:
          month !== previousMonth
            ? weekStart.toLocaleString(undefined, { month: 'short' })
            : '',
        days: [],
      };

      for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
        const date = new Date(weekStart);
        date.setDate(weekStart.getDate() + dayIndex);
        const inRange = date >= fromDate && date <= toDate;
        const count = inRange ? (counts.get(this.dateKey(date)) ?? 0) : 0;
        const level =
          count === 0 || maxCount === 0 ? 0 : Math.ceil((count / maxCount) * 4);
        const formattedDate = date.toLocaleDateString(undefined, {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        });

        week.days.push({
          date,
          count,
          level,
          label: inRange
            ? `${count} contribution${count === 1 ? '' : 's'} on ${formattedDate}`
            : '',
          inRange,
        });
      }

      weeks.push(week);
      previousMonth = month;
    }

    return weeks;
  }

  private toLocalDate(value: Date | string): Date {
    if (typeof value === 'string') {
      const [year, month, day] = value.split('-').map(Number);
      if (year && month && day) {
        return new Date(year, month - 1, day);
      }
    }

    const date = new Date(value);
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  private dateKey(date: Date): string {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${date.getFullYear()}-${month}-${day}`;
  }
}
