export namespace DateUtils {
  export function newDate(
    year: number,
    month: number,
    day: number,
    hour?: number,
    minute?: number,
    second?: number,
  ): Date {
    return new Date(year, month - 1, day, hour || 0, minute || 0, second || 0);
  }

  export function fromJsDateToString(date: Date): string | null {
    if (!date || isNaN(date.getTime())) return null;

    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();

    const mm = month.toString().padStart(2, '0');
    const dd = day.toString().padStart(2, '0');

    return `${year}-${mm}-${dd}`;
  }

  export function fromStringToJsDate(date: string): Date | null {
    if (!date) return null;

    const [year, month, day] = date.split('-').map(Number);

    if (!year || !month || !day) return null;

    const jsDate = new Date(year, month - 1, day);

    if (
      jsDate.getFullYear() !== year ||
      jsDate.getMonth() !== month - 1 ||
      jsDate.getDate() !== day
    ) {
      return null;
    }

    return jsDate;
  }

  export function getStartOfTheYear({ subtractYears = 0 } = {}) {
    return new Date(`${new Date().getFullYear() - subtractYears}-01-01`);
  }

  export function splitDate(date: string): string | null {
    if (!date) return null;
    return date.split('T')[0];
  }

  export function fromSplittedStringToJsDate(date: string): Date | null {
    return fromStringToJsDate(splitDate(date));
  }
}
