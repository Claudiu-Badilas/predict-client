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
  @Input({ required: true }) chartOptions: Highcharts.Options;
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
    if (this.chart && changes['chartOptions']) {
      this.updateChart();
    } else if (this.chartOptions) {
      this.createChart();
    }
  }

  ngAfterViewInit(): void {
    this.createChart();
  }

  private createChart(): void {
    const container =
      this.el.nativeElement.querySelector<HTMLElement>('.chart-container');
    if (!container || this.chart) return;

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
      this.chart.update(updatedOptions);
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
