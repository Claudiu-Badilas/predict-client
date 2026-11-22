import { describe, expect, it } from 'vitest';
import { HighchartsWrapperUtils } from './highcharts-wrapper.utils';

describe('HighchartsWrapperUtils', () => {
  const colors = {
    surface: '#ffffff',
    textPrimary: '#111111',
    textSecondary: '#555555',
    border: '#dddddd',
    accent: '#3366ff',
  };

  it('builds chart options with theme colors and disabled credits', () => {
    const options = HighchartsWrapperUtils.buildChartOptions(
      {
        title: { text: 'Balance' },
        xAxis: { labels: { style: { fontSize: '12px' } } },
      },
      colors,
    );

    expect(options.chart?.backgroundColor).toBe('transparent');
    expect(options.title?.style?.color).toBe(colors.textPrimary);
    expect((options.xAxis as { lineColor?: string }).lineColor).toBe(
      colors.border,
    );
    expect(options.credits?.enabled).toBe(false);
    expect(options.tooltip?.backgroundColor).toBe(colors.surface);
  });

  it('provides responsive chart rules for mobile, tablet, and desktop', () => {
    const { rules } = HighchartsWrapperUtils.getResponsiveConfig();

    expect(rules).toHaveLength(3);
    expect(rules[0].condition).toMatchObject({ maxWidth: 580 });
    expect(rules[1].condition).toMatchObject({ minWidth: 481, maxWidth: 768 });
    expect(rules[2].condition).toMatchObject({ minWidth: 769 });
  });
});
