export class MathUtil {
  static round(value: number, { digits = 2 } = {}): number {
    const factor = Math.pow(10, digits);
    return Math.round(value * factor) / factor;
  }

  static percent(target: number, total: number): number {
    if (total === 0) return 0;

    return (target / total) * 100;
  }

  static calculatePercentile(values: number[], percentile: number): number {
    if (values.length === 0) return 0;

    const sorted = [...values].sort((a, b) => a - b);
    const index = (percentile / 100) * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);

    if (lower === upper) {
      return sorted[lower];
    }

    // Linear interpolation
    return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
  }
}
