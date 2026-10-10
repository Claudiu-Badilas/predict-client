export namespace JsDateUtils {
  export function isValidDate(d: any): boolean {
    return d instanceof Date && !isNaN(d.getTime());
  }

  export function isBefore(d1: Date, d2: Date): boolean {
    if (!isValidDate(d1) || !isValidDate(d2)) return false;
    return d1.getTime() < d2.getTime();
  }

  export function isAfter(d1: Date, d2: Date): boolean {
    if (!isValidDate(d1) || !isValidDate(d2)) return false;
    return d1.getTime() > d2.getTime();
  }

  export function isSame(d1: Date, d2: Date): boolean {
    if (!isValidDate(d1) || !isValidDate(d2)) return false;
    return d1.getTime() === d2.getTime();
  }

  export function isSameOrBefore(d1: Date, d2: Date): boolean {
    return isSame(d1, d2) || isBefore(d1, d2);
  }

  export function isSameOrAfter(d1: Date, d2: Date): boolean {
    return isSame(d1, d2) || isAfter(d1, d2);
  }

  export function isBetween(from: Date, target: Date, to: Date): boolean {
    return isSameOrAfter(from, target) && isSameOrBefore(target, to);
  }

  export function addMonths(date: Date, months: number): Date {
    const result = new Date(date);

    const day = result.getDate();
    result.setMonth(result.getMonth() + months);

    if (result.getDate() < day) result.setDate(0);

    return result;
  }

  export function addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  export function dateDiffYMD(start: Date, end: Date): string {
    if (!isValidDate(start) || !isValidDate(end)) return null;

    if (end < start) [start, end] = [end, start];

    let years: number = end.getFullYear() - start.getFullYear();
    let months: number = end.getMonth() - start.getMonth();
    let days: number = end.getDate() - start.getDate();
    let hours: number = end.getHours() - start.getHours();
    let minutes: number = end.getMinutes() - start.getMinutes();

    if (minutes < 0) {
      minutes += 60;
      hours--;
    }

    if (hours < 0) {
      hours += 24;
      days--;
    }

    if (days < 0) {
      const prevMonth: Date = new Date(end.getFullYear(), end.getMonth(), 0);
      days += prevMonth.getDate();
      months--;
    }

    if (months < 0) {
      months += 12;
      years--;
    }

    const parts: string[] = [];

    if (years > 0) parts.push(`${years}y`);
    if (months > 0) parts.push(`${months}m`);
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}min`);

    if (parts.length === 0) return '0min';

    return parts.join(' ');
  }
}
