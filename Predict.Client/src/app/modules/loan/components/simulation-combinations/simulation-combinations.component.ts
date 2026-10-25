import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  effect,
  input,
} from '@angular/core';
import {
  FormArray,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { NumericInputComponent } from 'src/app/shared/components/numeric-input/numeric-input.component';
import {
  SimulationCombination,
  SimulationCombinationsStore,
} from './simulation-combinations.store';

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
    <div class="combinations-header">
      <ng-content select="[combination-leading-action]"></ng-content>
      <button
        type="button"
        class="btn-add"
        [disabled]="form.invalid"
        (click)="addRow()"
      >
        + Add combination
      </button>
    </div>
    <div class="simulation-rows">
      @for (row of store.rows(); track row.id; let i = $index) {
        <div class="combination-card">
          <span class="combination-index">{{ i + 1 }}</span>
          <div class="combination-inputs">
            <p-numeric-input
              [id]="'monthlyAmount_' + row.id"
              label="Amount"
              [control]="rows.at(i).controls.monthlyAmount"
            />
            <p-numeric-input
              [id]="'payments_' + row.id"
              label="Payments"
              [control]="rows.at(i).controls.payments"
            />
          </div>
          <button
            type="button"
            class="btn-delete"
            [disabled]="store.rows().length === 1"
            [attr.aria-label]="'Delete combination ' + (i + 1)"
            (click)="removeRow(row.id)"
          >
            ✕
          </button>
        </div>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        min-width: 0;
      }
      .combinations-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 8px;
      }
      .simulation-rows {
        display: grid;
        grid-template-columns: minmax(0, 1fr);
        align-content: start;
        gap: 6px;
        max-height: 186px;
        overflow-y: auto;
        padding-right: 4px;
        scrollbar-color: var(--theme-border-strong) transparent;
        scrollbar-width: thin;
      }
      .combination-card {
        display: flex;
        align-items: center;
        justify-content: flex-start;
        gap: 10px;
        height: 58px;
        box-sizing: border-box;
        min-width: 0;
        padding: 7px 10px;
        border: 1px solid var(--theme-border);
        border-radius: 9px;
        background: var(--theme-surface);
      }
      .combination-index {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 22px;
        height: 22px;
        border-radius: 7px;
        background: var(--theme-accent-subtle);
        color: var(--theme-accent);
        font-size: 11px;
        font-weight: 700;
      }
      .combination-label {
        flex: 0 0 110px;
        color: var(--theme-text-primary);
        font-size: 12px;
        font-weight: 600;
      }
      .combination-inputs {
        display: flex;
        align-items: center;
        gap: 10px;
        width: min(100%, 420px);
        min-width: 0;
      }
      .combination-inputs p-numeric-input {
        flex: 1 1 180px;
        min-width: 0;
        max-width: 200px;
      }
      :host ::ng-deep .combination-card .numeric-input {
        text-align: left !important;
        padding-left: 12px !important;
      }
      .btn-delete {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        border: 1px solid var(--theme-border);
        background: var(--theme-surface);
        color: var(--theme-text-secondary);
        cursor: pointer;
        line-height: 1;
        flex-shrink: 0;
      }
      .btn-delete:hover:not(:disabled) {
        background: var(--theme-danger-subtle);
        color: var(--theme-danger);
        border-color: var(--theme-danger);
      }
      .btn-delete:disabled {
        opacity: 0.35;
        cursor: not-allowed;
      }
      .btn-add {
        width: auto;
        padding: 5px 10px;
        border: 1px solid var(--theme-border);
        border-radius: 7px;
        background: var(--theme-surface-muted);
        color: var(--theme-text-primary);
        font-size: 12px;
        font-weight: 600;
        white-space: nowrap;
        cursor: pointer;
      }
      .btn-add:hover:not(:disabled) {
        border-color: var(--theme-accent);
        background: var(--theme-accent-subtle);
        color: var(--theme-accent);
      }
      .btn-add:disabled {
        opacity: 0.45;
        cursor: not-allowed;
      }
      @media (max-width: 575.98px) {
        .combinations-header {
          margin-bottom: 6px;
        }
        .simulation-rows {
          grid-template-columns: minmax(0, 1fr);
          gap: 5px;
          max-height: 146px;
        }
        .combination-card {
          grid-template-columns: 22px minmax(0, 1fr) 24px;
          height: 46px;
          gap: 6px;
          padding: 5px 6px;
          border-radius: 8px;
        }
        .combination-index {
          grid-column: 1;
          grid-row: 1;
        }
        .combination-label {
          display: none;
        }
        .combination-card > .btn-delete {
          grid-column: 3;
          grid-row: 1;
          width: 24px;
          height: 24px;
          padding: 0;
        }
        .combination-inputs {
          grid-column: 2;
          grid-row: 1;
          gap: 4px;
          width: auto;
        }
        .simulation-rows {
          gap: 4px;
        }
        .btn-add {
          padding: 4px 8px;
          font-size: 12px;
        }
        :host ::ng-deep .combination-card .numeric-input {
          height: 34px;
          padding: 0 6px !important;
          font-size: 13px;
          text-align: center !important;
        }
        :host ::ng-deep .combination-card .numeric-input-label {
          left: 7px;
          font-size: 11px;
        }
      }
    `,
  ],
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
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const last = this.store.rows().at(-1);
    this.rows.push(
      this.createForm({
        id: this.newId(),
        monthlyAmount: last?.monthlyAmount ?? 3750,
        payments: last?.payments ?? 1,
      }),
    );
    this.updateValidators();
    this.syncRows();
  }

  removeRow(id: string): void {
    if (this.store.rows().length <= 1) return;
    const index = this.rows.controls.findIndex(
      (row) => row.controls.id.value === id,
    );
    if (index >= 0) {
      this.rows.removeAt(index);
      this.updateValidators();
      this.syncRows();
    }
  }

  private createForm(row: SimulationCombination): CombinationForm {
    return new FormGroup({
      id: new FormControl(row.id, { nonNullable: true }),
      monthlyAmount: new FormControl(row.monthlyAmount, {
        validators: [Validators.required, Validators.min(1)],
      }),
      payments: new FormControl(row.payments, {
        validators: [Validators.min(1)],
      }),
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

  private syncRows(): void {
    this.store.setRows(this.rows.getRawValue());
  }
  private newId(): string {
    return `row_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }
}
