import { describe, it } from 'vitest';
import { MostCommonProductsComponent } from './most-common-products.component';
import { expectComponentCreation } from 'src/app/testing/component-test-setup';

describe('MostCommonProductsComponent', () => {
  it('should create', () => {
    expectComponentCreation(MostCommonProductsComponent);
  });
});
