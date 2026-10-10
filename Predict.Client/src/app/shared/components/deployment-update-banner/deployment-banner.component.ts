import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DeploymentUpdateService } from '../../../core/services/deployment-update.service';

@Component({
  selector: 'p-deployment-banner',
  imports: [DatePipe],
  templateUrl: './deployment-banner.component.html',
  styleUrl: './deployment-banner.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeploymentBannerComponent {
  readonly deploymentUpdate = inject(DeploymentUpdateService);

  reload(): void {
    window.location.reload();
  }
}
