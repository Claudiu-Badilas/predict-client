import { describe, it } from 'vitest';
import { SimulationCombinationsComponent } from './simulation-combinations.component';
import { expectComponentCreation } from 'src/app/testing/component-test-setup';

describe('SimulationCombinationsComponent', () => {
  it('should create', () => {
    expectComponentCreation(SimulationCombinationsComponent);
  });
});
