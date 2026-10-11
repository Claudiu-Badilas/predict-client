import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Actions } from '@ngrx/effects';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { filter } from 'rxjs';
import { StorageSettingsService } from 'src/app/shared/services/storage-settings.service';

export interface StorageManagerConfig {
  title: string;
  storageKey: string;
  loadFailureActionType: string;
  obsoleteStorageKeys?: string[];
  uploadValidator?: (data: unknown) => boolean;
}

@Component({
  selector: 'p-storage-manager-modal',
  imports: [CommonModule],
  templateUrl: './storage-manager-modal.component.html',
  styleUrl: './storage-manager-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class StorageManagerModalComponent implements OnInit {
  @Input({ required: true }) config!: StorageManagerConfig;
  @Output() reloadRequested = new EventEmitter<void>();

  private readonly settingsService = inject(StorageSettingsService);
  private readonly actions = inject(Actions);
  private readonly destroyRef = inject(DestroyRef);
  readonly activeModal = inject(NgbActiveModal, { optional: true });

  readonly errorMessage = signal<string | null>(null);
  readonly hasStoredItem = signal(false);

  ngOnInit(): void {
    this.config.obsoleteStorageKeys?.forEach((key) => {
      const oldValue = localStorage.getItem(key);
      if (oldValue === null) return;

      if (localStorage.getItem(this.config.storageKey) === null) {
        localStorage.setItem(this.config.storageKey, oldValue);
      }
      localStorage.removeItem(key);
    });
    this.refreshStorageState();
    this.actions
      .pipe(
        filter((action) => action.type === this.config.loadFailureActionType),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((action) => {
        const message = 'message' in action ? action.message : null;
        this.errorMessage.set(
          typeof message === 'string' ? message : 'Failed to load stored data.',
        );
      });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    input.value = '';
    this.errorMessage.set(null);
    this.settingsService
      .uploadStorageItemFromJson(
        this.config.storageKey,
        file,
        this.config.uploadValidator,
      )
      .then(() => {
        this.refreshStorageState();
        this.reloadRequested.emit();
      })
      .catch((error: unknown) => {
        this.errorMessage.set(
          error instanceof Error ? error.message : 'Failed to upload file.',
        );
      });
  }

  refreshStorageState(): void {
    this.hasStoredItem.set(
      localStorage.getItem(this.config.storageKey) !== null,
    );
  }

  downloadItem(): void {
    this.settingsService.downloadStorageItem(this.config.storageKey);
  }

  removeItem(): void {
    this.settingsService.removeStorageItem(this.config.storageKey);
    this.refreshStorageState();
  }
}
