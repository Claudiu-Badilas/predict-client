import { describe, it } from 'vitest';
import { HomeComponent } from './home.component';
import { expectComponentCreation } from 'src/app/testing/component-test-setup';

describe('HomeComponent', () => {
  it('should create', () => {
    expectComponentCreation(HomeComponent);
  });
});
