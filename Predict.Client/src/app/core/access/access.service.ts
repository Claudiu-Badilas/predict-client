import { inject, Injectable } from '@angular/core';
import { LoanEncryptionKeyBase64 } from '../../modules/loan/services/loan.service';
import { LocalStorageService } from '../services/local-storage.service';

@Injectable({ providedIn: 'root' })
export class AccessService {
  private readonly localStorage = inject(LocalStorageService);

  hasValidAccessKey(): boolean {
    const storedKey = this.localStorage.getItem<unknown>(
      LoanEncryptionKeyBase64,
    );
    return this.normalizeAesKey(storedKey) !== null;
  }

  ensureValidAccessKey(): boolean {
    const storedKey = this.localStorage.getItem<unknown>(
      LoanEncryptionKeyBase64,
    );
    const normalizedKey = this.normalizeAesKey(storedKey);
    if (!normalizedKey) return false;

    if (normalizedKey !== storedKey) {
      this.localStorage.setItem(LoanEncryptionKeyBase64, normalizedKey);
    }

    return true;
  }

  saveAccessKey(value: unknown): boolean {
    const normalizedKey = this.normalizeAesKey(value);
    if (!normalizedKey) return false;

    this.localStorage.setItem(LoanEncryptionKeyBase64, normalizedKey);
    return true;
  }

  private normalizeAesKey(value: unknown): string | null {
    if (typeof value !== 'string' || value.trim() === '') return null;

    const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(normalized)) return null;

    const unpadded = normalized.replace(/=+$/, '');
    if (unpadded.length % 4 === 1) return null;

    const paddingLength = (4 - (unpadded.length % 4)) % 4;
    const base64 = unpadded.padEnd(unpadded.length + paddingLength, '=');

    try {
      const decodedKey = atob(base64);
      return [16, 24, 32].includes(decodedKey.length) ? base64 : null;
    } catch {
      return null;
    }
  }
}
