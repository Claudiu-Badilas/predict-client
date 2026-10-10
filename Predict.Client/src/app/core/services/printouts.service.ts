import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class PrintoutsService {
  download<T>(data: T, fileName: string): void {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    window.URL.revokeObjectURL(url);
  }

  upload<T>(file: File): Promise<T> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        const result = reader.result as string;
        const parsed = JSON.parse(result) as T;
        resolve(parsed);
      };

      reader.onerror = () => reject('Error reading file');

      reader.readAsText(file);
    });
  }
}
