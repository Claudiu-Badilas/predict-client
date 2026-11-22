import { describe, it } from 'vitest';
import { LoginRegisterComponent } from './login-register.component';
import { expectComponentCreation } from 'src/app/testing/component-test-setup';

describe('LoginRegisterComponent', () => {
  it('should create', () => {
    expectComponentCreation(LoginRegisterComponent);
  });
});
