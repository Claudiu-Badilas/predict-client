import { describe, expect, it } from 'vitest';
import { DateUtils } from './date.utils';

describe('DateUtils', () => {
  it('formats and parses calendar dates', () => {
    const date = DateUtils.newDate(2024, 2, 9);

    expect(DateUtils.fromJsDateToString(date)).toBe('2024-02-09');
    expect(DateUtils.fromStringToJsDate('2024-02-09')).toEqual(date);
  });

  it('rejects malformed and impossible dates', () => {
    expect(DateUtils.fromJsDateToString(new Date('invalid'))).toBeNull();
    expect(DateUtils.fromStringToJsDate('2024-02-30')).toBeNull();
    expect(DateUtils.fromStringToJsDate('')).toBeNull();
  });

  it('splits ISO timestamps before parsing', () => {
    expect(DateUtils.splitDate('2024-06-12T18:20:00Z')).toBe('2024-06-12');
    expect(
      DateUtils.fromSplittedStringToJsDate('2024-06-12T18:20:00Z'),
    ).toEqual(DateUtils.newDate(2024, 6, 12));
  });
});
