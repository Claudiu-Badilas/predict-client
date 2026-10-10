import { Injectable } from '@angular/core';
import { LocalStorageService } from 'src/app/core/services/local-storage.service';

@Injectable({ providedIn: 'root' })
export class StorageSettingsService {
  constructor(private readonly localStorage: LocalStorageService) {}

  uploadStorageItemFromJson(
    storageKey: string,
    file: File,
    uploadValidator?: (data: unknown) => boolean,
  ): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (file.type !== 'application/json') {
        reject(new Error('Invalid file type. Please upload a JSON file.'));
        return;
      }

      const reader = new FileReader();

      reader.onload = (event: ProgressEvent<FileReader>) => {
        try {
          const jsonContent = event.target?.result as string;
          const data: unknown = JSON.parse(jsonContent);

          if (uploadValidator ? !uploadValidator(data) : !Array.isArray(data)) {
            reject(new Error('JSON file has an unsupported format.'));
            return;
          }

          this.localStorage.setItem(storageKey, data);
          resolve(true);
        } catch (error) {
          reject(
            new Error(`Failed to parse JSON file: ${(error as Error).message}`),
          );
        }
      };

      reader.onerror = () => reject(new Error('Failed to read file.'));
      reader.readAsText(file);
    });
  }

  downloadStorageItem(storageKey: string): void {
    const value = this.localStorage.getItem<unknown>(storageKey);

    if (!value) {
      alert('No stored data available to download.');
      return;
    }

    const blob = new Blob([JSON.stringify(value, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${storageKey}.json`;
    anchor.hidden = true;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  removeStorageItem(storageKey: string): void {
    this.localStorage.removeItem(storageKey);
  }
}
