import { Injectable } from '@angular/core';

import { LocalStorageService } from './local-storage.service';

export interface EncryptedData {
  iv: string;
  ciphertext: string;
}

@Injectable({ providedIn: 'root' })
export class EncryptionService {
  constructor(private readonly localStorage: LocalStorageService) {}

  public async encode<T>(
    data: T[],
    localStorageKey: string,
  ): Promise<EncryptedData> {
    const key = await this.generateKey(localStorageKey);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(JSON.stringify(data));

    const ciphertext = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encoded,
    );

    return {
      iv: this.bytesToBase64(iv),
      ciphertext: this.bytesToBase64(new Uint8Array(ciphertext)),
    };
  }

  public async decode<T>(
    encryptedData: EncryptedData,
    localStorageKey: string,
  ): Promise<T[]> {
    const key = await this.generateKey(localStorageKey);
    const decodedBytes = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: this.base64ToBytes(encryptedData.iv) },
      key,
      this.base64ToBytes(encryptedData.ciphertext),
    );
    const decoded = JSON.parse(new TextDecoder().decode(decodedBytes)) as T[];

    return decoded;
  }

  private async generateKey(localStorageKey: string) {
    return await crypto.subtle.importKey(
      'raw',
      this.base64ToBytes(this.localStorage.getItem<string>(localStorageKey)),
      'AES-GCM',
      false,
      ['encrypt', 'decrypt'],
    );
  }

  private base64ToBytes(value: string): Uint8Array<ArrayBuffer> {
    const binary = atob(value);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index++) {
      bytes[index] = binary.charCodeAt(index);
    }
    return bytes;
  }

  private bytesToBase64(bytes: Uint8Array): string {
    const chunkSize = 0x8000;
    let binary = '';
    for (let index = 0; index < bytes.length; index += chunkSize) {
      binary += String.fromCharCode(
        ...bytes.subarray(index, index + chunkSize),
      );
    }
    return btoa(binary);
  }
}
