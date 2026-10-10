export namespace HighchartsWrapperUtils {
  export interface ChartThemeColors {
    surface: string;
    textPrimary: string;
    textSecondary: string;
    border: string;
    accent: string;
  }

  function themeAxes<
    T extends Highcharts.XAxisOptions | Highcharts.YAxisOptions,
  >(axes: T | T[] | undefined, colors: ChartThemeColors): T | T[] | undefined {
    if (!axes) return axes;

    const wasArray = Array.isArray(axes);
    const axisList = wasArray ? axes : [axes];
    const themedAxes = axisList.map((axis) => ({
      ...axis,
      lineColor: colors.border,
      tickColor: colors.border,
      gridLineColor: colors.border,
      labels: {
        ...axis.labels,
        style: {
          ...axis.labels?.style,
          color: colors.textSecondary,
        },
      },
    })) as T[];

    return wasArray ? themedAxes : themedAxes[0];
  }

  export const tooltipPositioner: Highcharts.TooltipPositionerCallbackFunction =
    function (
      this: Highcharts.Tooltip,
      labelWidth: number,
      labelHeight: number,
      point: Highcharts.Point,
    ): { x: number; y: number } {
      const chart = this.chart;
      const chartWidth = chart.plotWidth;
      const chartLeft = chart.plotLeft;

      let x = Math.max(
        0,
        Math.min(
          point.plotX + chartLeft - labelWidth / 2,
          chartLeft + chartWidth - labelWidth,
        ),
      );
      let y = chart.plotTop + 10;

      return { x: x, y: y };
    };

  // Common function to get responsive configuration
  export function getResponsiveConfig(): Highcharts.ResponsiveOptions {
    return {
      rules: [
        {
          condition: {
            maxWidth: 580, // Mobile
          },
          chartOptions: {
            chart: {
              spacing: [5, 5, 5, 5],
              height: 220,
            },
            plotOptions: {
              pie: {
                innerSize: '65%', // Even thicker on very small screens
                size: '70%',
                dataLabels: {
                  style: {
                    fontSize: '7px',
                    fontWeight: 'bold',
                  },
                  distance: 6,
                  connectorPadding: 4,
                },
              },
            },
            tooltip: {
              style: {
                fontSize: '11px',
              },
              padding: 8,
            },
          },
        },
        {
          condition: {
            minWidth: 481,
            maxWidth: 768, // Tablet
          },
          chartOptions: {
            chart: {
              spacing: [10, 10, 10, 10],
              height: 320,
            },
            plotOptions: {
              pie: {
                innerSize: '40%', // Thicker on tablet
                size: '75%',
                dataLabels: {
                  style: {
                    fontSize: '8px',
                  },
                  distance: 8,
                  connectorPadding: 6,
                },
              },
            },
            tooltip: {
              style: {
                fontSize: '12px',
              },
            },
          },
        },
        {
          condition: {
            minWidth: 769, // Desktop
          },
          chartOptions: {
            chart: {
              height: 420,
            },
            plotOptions: {
              pie: {
                innerSize: '50%', // Thicker on desktop (was 70%)
                size: '100%',
                dataLabels: {
                  style: {
                    fontSize: '11px',
                  },
                  distance: 20,
                  connectorPadding: 20,
                },
              },
            },
          },
        },
      ],
    };
  }

  // Common function to build chart options with responsiveness
  export function buildChartOptions(
    baseOptions: Highcharts.Options,
    colors: ChartThemeColors,
  ): Highcharts.Options {
    return {
      ...baseOptions,
      chart: {
        ...baseOptions.chart,
        backgroundColor: 'transparent',
        style: {
          ...baseOptions.chart?.style,
          color: colors.textPrimary,
        },
      },
      title: {
        ...baseOptions.title,
        style: {
          ...baseOptions.title?.style,
          color: colors.textPrimary,
        },
      },
      subtitle: {
        ...baseOptions.subtitle,
        style: {
          ...baseOptions.subtitle?.style,
          color: colors.textSecondary,
        },
      },
      xAxis: themeAxes(baseOptions.xAxis, colors),
      yAxis: themeAxes(baseOptions.yAxis, colors),
      legend: {
        ...baseOptions.legend,
        itemStyle: {
          ...baseOptions.legend?.itemStyle,
          color: colors.textPrimary,
        },
        itemHoverStyle: {
          ...baseOptions.legend?.itemHoverStyle,
          color: colors.accent,
        },
      },
      credits: { enabled: false },
      tooltip: {
        ...baseOptions.tooltip,
        backgroundColor: colors.surface,
        borderColor: colors.border,
        style: {
          ...baseOptions.tooltip?.style,
          color: colors.textPrimary,
        },
        positioner: tooltipPositioner,
      },
      responsive: baseOptions.responsive ?? getResponsiveConfig(),
    };
  }
}
