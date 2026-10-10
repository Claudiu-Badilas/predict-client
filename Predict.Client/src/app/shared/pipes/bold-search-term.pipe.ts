import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'boldSearch',

  pure: true,
})
export class BoldSearchPipe implements PipeTransform {
  transform(text: string, searchTerm: string): string {
    if (!text || !searchTerm) {
      return text;
    }

    const terms = searchTerm
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    if (!terms.length) {
      return text;
    }

    const escapedTerms = terms.map((t) => this.escapeRegExp(t));
    const regex = new RegExp(`(${escapedTerms.join('|')})`, 'gi');

    return text.replace(regex, '<strong>$1</strong>');
  }

  private escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
