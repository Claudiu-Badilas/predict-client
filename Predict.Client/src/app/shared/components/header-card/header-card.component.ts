import { CommonModule, NgClass } from '@angular/common';
import { Component, input } from '@angular/core';
import { NumberFormatPipe } from '../../pipes/number-format.pipe';
import { HeaderCardInput } from './models/header-card-input.model';
import { JsDateUtils } from '../../utils/js-date.utils';

@Component({
  selector: 'p-header-card',
  imports: [CommonModule, NgClass, NumberFormatPipe],
  templateUrl: './header-card.component.html',
  styleUrl: './header-card.component.scss',
})
export class HeaderCardComponent {
  headerCardInputs = input.required<HeaderCardInput[]>();

  isNumber(value: string | number | Date): value is number {
    return typeof value === 'number' && !Number.isNaN(value);
  }

  isDate(value: string | number | Date): value is Date {
    return JsDateUtils.isValidDate(value);
  }
}
