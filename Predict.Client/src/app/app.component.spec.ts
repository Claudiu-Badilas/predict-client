import { describe, it } from 'vitest';
import { AppComponent } from './app.component';
import { expectComponentCreation } from 'src/app/testing/component-test-setup';

describe('AppComponent', () => {
  it('should create', () => {
    expectComponentCreation(AppComponent);
  });
});
