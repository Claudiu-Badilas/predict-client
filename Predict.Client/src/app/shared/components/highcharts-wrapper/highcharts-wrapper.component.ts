import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  effect,
  Input,
  inject,
  OnChanges,
  OnDestroy,
  SimpleChanges,
} from '@angular/core';
import Highcharts from 'highcharts';
import { ThemeService } from 'src/app/core/services/theme.service';
import { HighchartsWrapperUtils } from './utils/highcharts-wrapper.utils';

@Component({
  selector: 'p-highcharts-wrapper',
  templateUrl: './highcharts-wrapper.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HighchartWrapperComponent
  implements OnChanges, AfterViewInit, OnDestroy
{
  @Input({ required: true }) chartOptions: Highcharts.Options | null;
  private chart: Highcharts.Chart | undefined;

  constructor(private el: ElementRef<HTMLElement>) {
    effect(() => {
      this.themeService.theme();
      if (this.chart && this.chartOptions) {
        this.updateChart();
      }
    });
  }

  private readonly themeService = inject(ThemeService);

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['chartOptions']) return;

    if (!this.chartOptions) {
      this.chart?.destroy();
      this.chart = undefined;
    } else if (this.chart) {
      this.updateChart();
    } else {
      this.createChart();
    }
  }

  ngAfterViewInit(): void {
    this.createChart();
  }

  private createChart(): void {
    const container =
      this.el.nativeElement.querySelector<HTMLElement>('.chart-container');
    if (!container || this.chart || !this.chartOptions) return;

    const options = HighchartsWrapperUtils.buildChartOptions(
      this.chartOptions,
      this.getThemeColors(),
    );
    this.chart = Highcharts.chart(container, options);
  }

  private updateChart(): void {
    if (this.chart && this.chartOptions) {
      const updatedOptions = HighchartsWrapperUtils.buildChartOptions(
        this.chartOptions,
        this.getThemeColors(),
      );
      this.chart.update(updatedOptions, true, true);
    }
  }

  private getThemeColors(): HighchartsWrapperUtils.ChartThemeColors {
    const document = this.el.nativeElement.ownerDocument;
    const styles = document.defaultView?.getComputedStyle(
      document.documentElement,
    );
    const read = (name: string) => styles?.getPropertyValue(name).trim() ?? '';

    return {
      surface: read('--theme-surface'),
      textPrimary: read('--theme-text-primary'),
      textSecondary: read('--theme-text-secondary'),
      border: read('--theme-border'),
      accent: read('--theme-accent'),
    };
  }

  ngOnDestroy(): void {
    if (this.chart) {
      this.chart.destroy();
      this.chart = undefined;
    }
  }
}
