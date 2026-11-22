import { describe, it } from 'vitest';
import { ToastNotificationComponent } from './toast-notification.component';
import { expectComponentCreation } from 'src/app/testing/component-test-setup';

describe('ToastNotificationComponent', () => {
  it('should create', () => {
    expectComponentCreation(ToastNotificationComponent);
  });
});
