import { describe, expect, it } from 'vitest';
import { MathUtil } from './math.utils';

describe('MathUtil', () => {
  it('rounds to two decimal places by default and supports a custom precision', () => {
    expect(MathUtil.round(12.345)).toBe(12.35);
    expect(MathUtil.round(12.345, { digits: 1 })).toBe(12.3);
  });

  it('returns zero percent when the total is zero', () => {
    expect(MathUtil.percent(10, 0)).toBe(0);
    expect(MathUtil.percent(1, 4)).toBe(25);
  });

  it('interpolates percentiles without mutating the input', () => {
    const values = [30, 10, 20];

    expect(MathUtil.calculatePercentile(values, 50)).toBe(20);
    expect(MathUtil.calculatePercentile(values, 25)).toBe(15);
    expect(values).toEqual([30, 10, 20]);
    expect(MathUtil.calculatePercentile([], 90)).toBe(0);
  });
});
