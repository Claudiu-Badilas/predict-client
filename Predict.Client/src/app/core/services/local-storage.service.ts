import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LocalStorageService {
  constructor() {}

  setItem(key: string, value: any): void {
    try {
      const jsonData = JSON.stringify(value);
      localStorage.setItem(key, jsonData);
    } catch (e) {
      console.error('Error saving to localStorage', e);
    }
  }

  getItem<T>(key: string): T | null {
    try {
      const data = localStorage.getItem(key);
      return data ? (JSON.parse(data) as T) : null;
    } catch (e) {
      console.error('Error reading from localStorage', e);
      return null;
    }
  }

  removeItem(key: string): void {
    localStorage.removeItem(key);
  }

  clear(): void {
    localStorage.clear();
  }
}
