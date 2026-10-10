import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'numberFormat' })
export class NumberFormatPipe implements PipeTransform {
  transform(
    value: number | string,
    defaultValue: string = null,
    digits: number = 2,
  ): string {
    return NumberFormatPipe.numberFormat(value, defaultValue, digits);
  }

  static numberFormat(
    value: number | string,
    defaultValue: string = null,
    digits: number = 2,
  ) {
    if (value === null || value === undefined || value === '') {
      return defaultValue ?? null;
    }

    const num = Number(value);
    if (isNaN(num)) return defaultValue ?? null;

    const fixed = num.toFixed(digits);

    const [integerPart, decimalPart] = fixed.split('.');

    const formattedInt = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

    return decimalPart ? `${formattedInt}.${decimalPart}` : formattedInt;
  }
}
