import { describe, expect, it } from 'vitest';
import { Calculator } from './calculator.utils';

describe('Calculator', () => {
  it('sums values while ignoring null entries', () => {
    expect(Calculator.sum([3, null, 4] as number[])).toBe(7);
  });

  it('returns null for an empty or missing list', () => {
    expect(Calculator.sum([])).toBeNull();
    expect(Calculator.sum(null)).toBeNull();
  });
});
