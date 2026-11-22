import { describe, it } from 'vitest';
import { DeploymentBannerComponent } from './deployment-banner.component';
import { expectComponentCreation } from 'src/app/testing/component-test-setup';

describe('DeploymentBannerComponent', () => {
  it('should create', () => {
    expectComponentCreation(DeploymentBannerComponent);
  });
});
