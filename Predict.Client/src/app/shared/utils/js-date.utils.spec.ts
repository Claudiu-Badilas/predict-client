import { describe, expect, it } from 'vitest';
import { JsDateUtils } from './js-date.utils';

describe('JsDateUtils', () => {
  it('compares valid dates and rejects invalid dates', () => {
    const earlier = new Date(2024, 0, 1);
    const later = new Date(2024, 0, 2);

    expect(JsDateUtils.isBefore(earlier, later)).toBe(true);
    expect(JsDateUtils.isAfter(later, earlier)).toBe(true);
    expect(JsDateUtils.isSame(earlier, new Date(earlier))).toBe(true);
    expect(JsDateUtils.isBefore(new Date('invalid'), later)).toBe(false);
  });

  it('adds days and clamps month shifts to the last valid day', () => {
    expect(JsDateUtils.addDays(new Date(2024, 0, 31), 1)).toEqual(
      new Date(2024, 1, 1),
    );
    expect(JsDateUtils.addMonths(new Date(2024, 0, 31), 1)).toEqual(
      new Date(2024, 1, 29),
    );
  });

  it('formats the elapsed date difference', () => {
    expect(
      JsDateUtils.dateDiffYMD(new Date(2024, 0, 1), new Date(2024, 1, 2)),
    ).toBe('1m 1d');
  });
});
