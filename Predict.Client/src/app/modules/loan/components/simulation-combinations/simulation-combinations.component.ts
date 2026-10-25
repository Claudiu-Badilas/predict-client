import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, input } from '@angular/core';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NumericInputComponent } from 'src/app/shared/components/numeric-input/numeric-input.component';
import { SimulationCombination, SimulationCombinationsStore } from './simulation-combinations.store';

type CombinationForm = FormGroup<{
  id: FormControl<string>;
  monthlyAmount: FormControl<number | null>;
  payments: FormControl<number | null>;
}>;

@Component({
  selector: 'p-simulation-combinations',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NumericInputComponent],
  template: `
    <div class="simulation-rows">
      @for (row of store.rows(); track row.id; let i = $index) {
        <div class="simulation-row pt-2">
          <div class="gap-2 d-flex align-items-center justify-content-between">
            <p-numeric-input [id]="'monthlyAmount_' + row.id" label="Amount" [control]="rows.at(i).controls.monthlyAmount" />
            <p-numeric-input [id]="'payments_' + row.id" label="Payments" [control]="rows.at(i).controls.payments" />
            <button type="button" class="btn-delete" [disabled]="store.rows().length === 1" [attr.aria-label]="'Delete simulation row ' + (i + 1)" (click)="removeRow(row.id)">✕</button>
          </div>
        </div>
      }
    </div>
    <div class="pt-2">
      <button type="button" class="btn-add" [disabled]="form.invalid" (click)="addRow()">+ Add combination</button>
    </div>
  `,
  styles: [`
    .simulation-row { display:flex; align-items:flex-start; gap:8px; }
    .btn-delete { width:28px; height:28px; border-radius:50%; border:1px solid var(--theme-border); background:var(--theme-surface); color:var(--theme-text-secondary); cursor:pointer; line-height:1; flex-shrink:0; }
    .btn-delete:hover:not(:disabled) { background:var(--theme-danger-subtle); color:var(--theme-danger); border-color:var(--theme-danger); }
    .btn-delete:disabled { opacity:.35; cursor:not-allowed; }
    .btn-add { width:100%; padding:8px 12px; border:1px dashed var(--theme-text-muted); border-radius:6px; background:transparent; color:var(--theme-text-primary); font-size:14px; font-weight:500; cursor:pointer; }
    .btn-add:hover { background:var(--theme-hover); border-color:var(--theme-border-strong); }
    .btn-add:disabled { opacity:.45; cursor:not-allowed; }
  `],
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class SimulationCombinationsComponent {
  readonly maxPayments = input<number | undefined>();
  readonly form = new FormGroup({ rows: new FormArray<CombinationForm>([]) });
  readonly rows = this.form.controls.rows;

  constructor(readonly store: SimulationCombinationsStore) {
    store.rows().forEach((row) => this.rows.push(this.createForm(row)));
    this.updateValidators();
    effect(() => {
      this.maxPayments();
      this.updateValidators();
    });
    this.rows.valueChanges.subscribe(() => this.syncRows());
  }

  addRow(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const last = this.store.rows().at(-1);
    this.rows.push(this.createForm({ id: this.newId(), monthlyAmount: last?.monthlyAmount ?? 3750, payments: last?.payments ?? 1 }));
    this.updateValidators();
    this.syncRows();
  }

  removeRow(id: string): void {
    if (this.store.rows().length <= 1) return;
    const index = this.rows.controls.findIndex((row) => row.controls.id.value === id);
    if (index >= 0) { this.rows.removeAt(index); this.updateValidators(); this.syncRows(); }
  }

  private createForm(row: SimulationCombination): CombinationForm {
    return new FormGroup({
      id: new FormControl(row.id, { nonNullable: true }),
      monthlyAmount: new FormControl(row.monthlyAmount, { validators: [Validators.required, Validators.min(1)] }),
      payments: new FormControl(row.payments, { validators: [Validators.min(1)] }),
    });
  }

  private updateValidators(): void {
    const max = this.maxPayments();
    this.rows.controls.forEach((row, index, all) => {
      const validators = [Validators.min(1)];
      if (max !== undefined) validators.push(Validators.max(max));
      if (index < all.length - 1) validators.unshift(Validators.required);
      row.controls.payments.setValidators(validators);
      row.controls.payments.updateValueAndValidity({ emitEvent: false });
    });
  }

  private syncRows(): void { this.store.setRows(this.rows.getRawValue()); }
  private newId(): string { return `row_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`; }
}
