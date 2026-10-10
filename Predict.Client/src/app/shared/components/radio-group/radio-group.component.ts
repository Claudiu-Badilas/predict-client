import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'p-radio-group',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './radio-group.component.html',
  styleUrl: './radio-group.component.scss',
})
export class RadioGroupComponent implements OnInit, OnChanges {
  @Input() options: { label: string; value: string }[];
  @Input() selected: string;
  @Output() selectionChange = new EventEmitter<string>();

  control = new FormControl();

  ngOnInit() {
    this.control.valueChanges.subscribe((value) => {
      if (value) {
        this.selectionChange.emit(value);
      }
    });
  }

  ngOnChanges(changes: any) {
    if (changes.selected && changes.selected.currentValue) {
      this.control.setValue(this.selected, { emitEvent: false });
    }
  }

  selectOption(value: string) {
    if (this.selected !== value) {
      this.control.setValue(value);
      this.selectionChange.emit(value);
    }
  }
}
