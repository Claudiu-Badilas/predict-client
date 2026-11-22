import { TestBed } from '@angular/core/testing';
import Highcharts from 'highcharts';
import { ThemeService } from 'src/app/core/services/theme.service';
import { describe, expect, it, vi } from 'vitest';
import { HighchartWrapperComponent } from './highcharts-wrapper.component';
import { expectComponentCreation } from 'src/app/testing/component-test-setup';

describe('HighchartWrapperComponent', () => {
  it('should create', () => {
    expectComponentCreation(HighchartWrapperComponent);
  });

  it('creates, updates, and destroys charts as options and theme change', () => {
    expectComponentCreation(HighchartWrapperComponent, (fixture) => {
      const chart = {
        destroy: vi.fn(),
        update: vi.fn(),
      };
      const createChart = vi
        .spyOn(Highcharts, 'chart')
        .mockReturnValue(chart as unknown as Highcharts.Chart);
      const theme = TestBed.inject(ThemeService) as unknown as {
        theme: { set(value: 'light' | 'dim' | 'dark'): void };
      };
      const component = fixture.componentInstance;

      fixture.componentRef.setInput('chartOptions', {
        title: { text: 'First chart' },
      });
      fixture.detectChanges();
      expect(createChart).toHaveBeenCalledOnce();
      expect(createChart.mock.calls[0][1]).toMatchObject({
        title: { text: 'First chart' },
      });
      component.ngAfterViewInit();
      expect(createChart).toHaveBeenCalledOnce();

      fixture.componentRef.setInput('chartOptions', {
        title: { text: 'Updated chart' },
      });
      fixture.detectChanges();
      expect(chart.update).toHaveBeenCalledWith(
        expect.objectContaining({
          title: expect.objectContaining({ text: 'Updated chart' }),
        }),
        true,
        true,
      );

      theme.theme.set('dark');
      fixture.detectChanges();
      expect(chart.update).toHaveBeenCalledTimes(2);

      component.ngOnChanges({});
      component.ngOnDestroy();
      expect(chart.destroy).toHaveBeenCalledOnce();
      fixture.componentRef.setInput('chartOptions', null);
      fixture.detectChanges();
      expect(createChart).toHaveBeenCalledOnce();
      (component as unknown as { updateChart: () => void }).updateChart();
      createChart.mockRestore();
    });
  });

  it('does not create a chart when its container is missing', () => {
    expectComponentCreation(HighchartWrapperComponent, (fixture) => {
      const createChart = vi.spyOn(Highcharts, 'chart');
      fixture.nativeElement.querySelector('.chart-container').remove();
      fixture.componentRef.setInput('chartOptions', { series: [] });
      fixture.detectChanges();
      expect(createChart).not.toHaveBeenCalled();
      createChart.mockRestore();
    });
  });
});
