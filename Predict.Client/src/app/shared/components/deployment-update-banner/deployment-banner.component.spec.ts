import { TestBed } from '@angular/core/testing';
import { DeploymentUpdateService } from 'src/app/core/services/deployment-update.service';
import { describe, expect, it, vi } from 'vitest';
import { DeploymentBannerComponent } from './deployment-banner.component';
import { expectComponentCreation } from 'src/app/testing/component-test-setup';

describe('DeploymentBannerComponent', () => {
  it('should create', () => {
    expectComponentCreation(DeploymentBannerComponent);
  });

  it('shows deployment metadata only when the update has it', () => {
    expectComponentCreation(DeploymentBannerComponent, (fixture) => {
      const service = TestBed.inject(DeploymentUpdateService);
      service.updateAvailable.set(true);
      service.availableDeployment.set({
        version: 'abc123',
        workflowRunNumber: 42,
        timestamp: '2026-11-22T00:00:00Z',
      });
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('Version abc123');
      expect(fixture.nativeElement.textContent).toContain('Workflow #42');
      expect(fixture.nativeElement.textContent).toContain('Deployed');

      service.availableDeployment.set({ version: 'def456' });
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('Version def456');
      expect(fixture.nativeElement.textContent).not.toContain('Workflow #');
      expect(fixture.nativeElement.querySelector('time')).toBeNull();

      const reload = vi.fn();
      vi.stubGlobal('window', { location: { reload } });
      fixture.componentInstance.reload();
      expect(reload).toHaveBeenCalledOnce();
      vi.unstubAllGlobals();
    });
  });
});
