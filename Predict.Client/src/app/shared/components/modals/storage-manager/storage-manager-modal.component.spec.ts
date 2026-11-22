import { describe, it } from 'vitest';
import { StorageManagerModalComponent } from './storage-manager-modal.component';
import { expectComponentCreation } from 'src/app/testing/component-test-setup';

describe('StorageManagerModalComponent', () => {
  it('should create', () => {
    expectComponentCreation(StorageManagerModalComponent);
  });
});
