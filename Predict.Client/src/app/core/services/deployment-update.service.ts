import { DestroyRef, Injectable, inject, signal } from '@angular/core';

const VERSION_CHECK_INTERVAL_MS = 10_000;

export interface DeploymentVersion {
  version: string;
  timestamp?: string;
  workflowRunNumber?: number | string | null;
}

@Injectable({ providedIn: 'root' })
export class DeploymentUpdateService {
  readonly updateAvailable = signal(false);
  readonly availableDeployment = signal<DeploymentVersion | null>(null);

  private readonly destroyRef = inject(DestroyRef);
  private currentVersion: string | null = null;

  constructor() {
    void this.checkForUpdate(true);

    const timer = setInterval(() => {
      void this.checkForUpdate();
    }, VERSION_CHECK_INTERVAL_MS);

    this.destroyRef.onDestroy(() => clearInterval(timer));
  }

  private async checkForUpdate(initialize = false): Promise<void> {
    if (window.location.hostname === 'localhost') return;

    try {
      const versionUrl = new URL('version.json', document.baseURI);
      versionUrl.searchParams.set('check', Date.now().toString());
      let response = await fetch(versionUrl, { cache: 'no-store' });

      if (!response.ok && versionUrl.pathname !== '/version.json') {
        versionUrl.pathname = '/version.json';
        response = await fetch(versionUrl, { cache: 'no-store' });
      }

      if (!response.ok) return;

      const deployment = (await response.json()) as DeploymentVersion;
      const deployedVersion = deployment?.version;
      if (typeof deployedVersion !== 'string' || deployedVersion.length === 0) {
        return;
      }

      if (initialize || this.currentVersion === null) {
        this.currentVersion = deployedVersion;
        return;
      }

      if (deployedVersion !== this.currentVersion) {
        this.availableDeployment.set(deployment);
        this.updateAvailable.set(true);
      }
    } catch {
      // Version checks are best-effort; the app remains usable if offline.
    }
  }
}
