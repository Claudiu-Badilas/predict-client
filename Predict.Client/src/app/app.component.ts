import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ThemeService } from './core/services/theme.service';
import { ToastNotificationComponent } from './core/toast-notifications/toast-notification.component';
import { DeploymentBannerComponent } from './shared/components/deployment-update-banner/deployment-banner.component';
import { SpinnerComponent } from './shared/components/spinner/spinner.component';

@Component({
  selector: 'p-root',
  imports: [
    RouterModule,
    SpinnerComponent,
    ToastNotificationComponent,
    DeploymentBannerComponent,
  ],
  providers: [],
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['app.component.scss'],
})
export class AppComponent {
  constructor() {
    inject(ThemeService);
  }
}
