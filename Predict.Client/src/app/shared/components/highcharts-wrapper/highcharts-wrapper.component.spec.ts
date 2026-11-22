import { describe, it } from 'vitest';
import { HighchartWrapperComponent } from './highcharts-wrapper.component';
import { expectComponentCreation } from 'src/app/testing/component-test-setup';

describe('HighchartWrapperComponent', () => {
  it('should create', () => {
    expectComponentCreation(HighchartWrapperComponent);
  });
});
