import { describe, it } from 'vitest';
import { SeasonalEffectComponent } from './seasonal-effect.component';
import { expectComponentCreation } from 'src/app/testing/component-test-setup';

describe('SeasonalEffectComponent', () => {
  it('should create', () => {
    expectComponentCreation(SeasonalEffectComponent);
  });
});
