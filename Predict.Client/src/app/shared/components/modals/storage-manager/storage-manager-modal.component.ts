import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  computed,
  signal,
  Signal,
  input,
  output,
} from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { StorageSettingsService } from 'src/app/shared/services/storage-settings.service';

export interface StorageManagerConfig {
  title: string;
  storageKey: string;
  loadError: Signal<string | null>;
  obsoleteStorageKeys?: string[];
  uploadValidator?: (data: unknown) => boolean;
}

@Component({
  selector: 'p-storage-manager-modal',
  imports: [CommonModule],
  templateUrl: './storage-manager-modal.component.html',
  styleUrl: './storage-manager-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StorageManagerModalComponent implements OnInit {
  readonly config = input.required<StorageManagerConfig>();
  readonly reloadRequested = output<void>();

  private readonly settingsService = inject(StorageSettingsService);
  readonly activeModal = inject(NgbActiveModal, { optional: true });

  private readonly uploadError = signal<string | null>(null);
  readonly errorMessage = computed(
    () => this.uploadError() ?? this.config().loadError(),
  );
  readonly hasStoredItem = signal(false);

  ngOnInit(): void {
    this.config().obsoleteStorageKeys?.forEach((key) => {
      const oldValue = localStorage.getItem(key);
      if (oldValue === null) return;

      if (localStorage.getItem(this.config().storageKey) === null) {
        localStorage.setItem(this.config().storageKey, oldValue);
      }
      localStorage.removeItem(key);
    });
    this.refreshStorageState();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    input.value = '';
    this.uploadError.set(null);
    this.settingsService
      .uploadStorageItemFromJson(
        this.config().storageKey,
        file,
        this.config().uploadValidator,
      )
      .then(() => {
        this.refreshStorageState();
        this.reloadRequested.emit();
      })
      .catch((error: unknown) => {
        this.uploadError.set(
          error instanceof Error ? error.message : 'Failed to upload file.',
        );
      });
  }

  refreshStorageState(): void {
    this.hasStoredItem.set(
      localStorage.getItem(this.config().storageKey) !== null,
    );
  }

  downloadItem(): void {
    this.settingsService.downloadStorageItem(this.config().storageKey);
  }

  removeItem(): void {
    this.settingsService.removeStorageItem(this.config().storageKey);
    this.refreshStorageState();
  }
}
