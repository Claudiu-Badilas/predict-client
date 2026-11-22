import { TestBed } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { signal } from '@angular/core';
import { StorageSettingsService } from 'src/app/shared/services/storage-settings.service';
import { describe, expect, it, vi } from 'vitest';
import { StorageManagerModalComponent } from './storage-manager-modal.component';
import {
  expectAsyncComponentCreation,
  expectComponentCreation,
} from 'src/app/testing/component-test-setup';

describe('StorageManagerModalComponent', () => {
  it('should create', () => {
    expectComponentCreation(StorageManagerModalComponent);
  });

  it('migrates stored keys and exposes download, remove, and modal actions', () => {
    expectComponentCreation(StorageManagerModalComponent, (fixture) => {
      const component = fixture.componentInstance;
      const service = TestBed.inject(StorageSettingsService);
      const download = vi.spyOn(service, 'downloadStorageItem');
      const remove = vi
        .spyOn(service, 'removeStorageItem')
        .mockImplementation((key) => localStorage.removeItem(key));
      const modal = TestBed.inject(NgbActiveModal);
      const dismiss = vi.spyOn(modal, 'dismiss');
      const config = {
        title: 'Data settings',
        storageKey: 'current-data',
        obsoleteStorageKeys: ['old-data', 'older-data'],
        loadError: signal<string | null>('Loading failed'),
      };

      localStorage.setItem('old-data', 'migrated');
      localStorage.setItem('older-data', 'keep-current');
      fixture.componentRef.setInput('config', config);
      component.ngOnInit();
      fixture.detectChanges();
      expect(localStorage.getItem('current-data')).toBe('migrated');
      expect(localStorage.getItem('old-data')).toBeNull();
      expect(localStorage.getItem('older-data')).toBeNull();
      expect(component.hasStoredItem()).toBe(true);
      expect(component.errorMessage()).toBe('Loading failed');
      expect(fixture.nativeElement.textContent).toContain('Data settings');

      component.downloadItem();
      expect(download).toHaveBeenCalledWith('current-data');
      fixture.nativeElement.querySelector('.remove-btn').click();
      expect(remove).toHaveBeenCalledWith('current-data');
      expect(component.hasStoredItem()).toBe(false);
      fixture.detectChanges();
      expect(
        fixture.nativeElement.querySelector('.storage-empty-state'),
      ).not.toBeNull();
      fixture.nativeElement.querySelector('.modal-close-btn').click();
      expect(dismiss).toHaveBeenCalledOnce();
    });
  });

  it('handles missing files, successful uploads, and upload errors', async () => {
    await expectAsyncComponentCreation(
      StorageManagerModalComponent,
      async (fixture) => {
        const component = fixture.componentInstance;
        const service = TestBed.inject(StorageSettingsService);
        const upload = vi.spyOn(service, 'uploadStorageItemFromJson');
        const emitReload = vi.spyOn(component.reloadRequested, 'emit');

        const emptyInput = document.createElement('input');
        component.onFileSelected({ target: emptyInput } as unknown as Event);
        expect(upload).not.toHaveBeenCalled();

        upload.mockImplementation(async (key) => {
          localStorage.setItem(key, 'uploaded');
          return true;
        });
        const goodInput = fileInput(
          new File(['{}'], 'data.json', { type: 'application/json' }),
        );
        component.onFileSelected({ target: goodInput } as unknown as Event);
        expect(upload).toHaveBeenCalledOnce();
        expect(goodInput.value).toBe('');
        const uploadResult = upload.mock.results[0].value;
        expect(uploadResult).toBeInstanceOf(Promise);
        await uploadResult;
        await fixture.whenStable();
        await new Promise((resolve) => setTimeout(resolve, 0));
        fixture.detectChanges();
        expect(component.errorMessage()).toBeNull();
        expect(emitReload).toHaveBeenCalledOnce();
        expect(component.hasStoredItem()).toBe(true);

        upload.mockRejectedValueOnce(new Error('Unsupported data'));
        const badInput = fileInput(
          new File(['bad'], 'bad.json', { type: 'application/json' }),
        );
        component.onFileSelected({ target: badInput } as unknown as Event);
        await vi.waitFor(() =>
          expect(component.errorMessage()).toBe('Unsupported data'),
        );
        expect(emitReload).toHaveBeenCalledOnce();

        upload.mockRejectedValueOnce('not an Error instance');
        const unknownErrorInput = fileInput(
          new File(['bad'], 'unknown.json', { type: 'application/json' }),
        );
        component.onFileSelected({
          target: unknownErrorInput,
        } as unknown as Event);
        await vi.waitFor(() =>
          expect(component.errorMessage()).toBe('Failed to upload file.'),
        );
      },
    );
  });
});

function fileInput(file: File): HTMLInputElement {
  const input = document.createElement('input');
  input.type = 'file';
  Object.defineProperty(input, 'files', { value: [file] });
  return input;
}
