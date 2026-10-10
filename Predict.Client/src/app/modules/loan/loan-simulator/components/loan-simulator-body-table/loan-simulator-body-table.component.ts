import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LoanStore } from 'src/app/modules/loan/stores/loan.store';
import { NumberFormatPipe } from 'src/app/shared/pipes/number-format.pipe';
import { ScrollableDirective } from 'src/app/shared/directives/scrollable.directive';
import { Calculator } from 'src/app/shared/utils/calculator.utils';
import { ThemeService } from 'src/app/core/services/theme.service';
import {
  LoanSimulatorInstalment,
  MonthlyInstalmentManager,
} from '../../models/loan-simulator.model';

@Component({
  selector: 'p-loan-simulator-body-table',
  imports: [CommonModule, FormsModule, NumberFormatPipe, ScrollableDirective],
  templateUrl: './loan-simulator-body-table.component.html',
  styleUrl: './loan-simulator-body-table.component.scss',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class LoanSimulatorBodyTableComponent {
  monthlyInstalmentGroups = input<MonthlyInstalmentManager[]>([]);
  gestureFeedback: {
    group: MonthlyInstalmentManager;
    direction: 'left' | 'right' | 'down' | 'up';
    label: string;
  } | null = null;

  private touchStart: {
    x: number;
    y: number;
    group: MonthlyInstalmentManager;
    index: number;
  } | null = null;
  private suppressGroupClickUntil = 0;

  completedMonthlyInstalmentGroupsCount = computed(
    () =>
      this.monthlyInstalmentGroups().filter((group) => group.completed).length,
  );

  store = inject(LoanStore);
  private readonly themeService = inject(ThemeService);

  getThemeIconPath(icon: string): string {
    return `assets/icons/${this.themeService.theme()}/${icon}.svg`;
  }

  toggleGroup(group: MonthlyInstalmentManager) {
    if (Date.now() < this.suppressGroupClickUntil) {
      return;
    }
    group.expanded = !group.expanded;
  }

  onMobileTouchStart(
    event: TouchEvent,
    group: MonthlyInstalmentManager,
    index: number,
  ) {
    if (index + 1 !== this.completedMonthlyInstalmentGroupsCount()) {
      this.touchStart = null;
      return;
    }

    const touch = event.touches[0];
    if (touch) {
      this.touchStart = { x: touch.clientX, y: touch.clientY, group, index };
    }
  }

  onMobileTouchMove(event: TouchEvent) {
    if (!this.touchStart) {
      return;
    }

    const touch = event.touches[0];
    if (!touch) {
      return;
    }

    const deltaX = touch.clientX - this.touchStart.x;
    const deltaY = touch.clientY - this.touchStart.y;
    let direction: 'left' | 'right' | 'down' | 'up' | null = null;

    if (Math.abs(deltaX) > 24 && Math.abs(deltaX) > Math.abs(deltaY) * 1.2) {
      direction = deltaX < 0 ? 'left' : 'right';
    } else if (deltaY > 32 && deltaY > Math.abs(deltaX) * 1.2) {
      direction = 'down';
    } else if (deltaY < -32 && Math.abs(deltaY) > Math.abs(deltaX) * 1.2) {
      direction = 'up';
    }

    if (direction) {
      if (event.cancelable) {
        event.preventDefault();
      }
      this.showGestureFeedback(this.touchStart.group, direction);
    }
  }

  onMobileTouchEnd(event: TouchEvent) {
    const start = this.touchStart;
    this.touchStart = null;
    if (
      !start ||
      start.index + 1 !== this.completedMonthlyInstalmentGroupsCount()
    ) {
      return;
    }

    const touch = event.changedTouches[0];
    if (!touch) {
      return;
    }

    const deltaX = touch.clientX - start.x;
    const deltaY = touch.clientY - start.y;
    let direction: 'left' | 'right' | 'down' | 'up' | null = null;

    if (Math.abs(deltaX) >= 56 && Math.abs(deltaX) > Math.abs(deltaY) * 1.2) {
      direction = deltaX < 0 ? 'left' : 'right';
    } else if (deltaY >= 64 && deltaY > Math.abs(deltaX) * 1.2) {
      direction = 'down';
    } else if (deltaY <= -64 && Math.abs(deltaY) > Math.abs(deltaX) * 1.2) {
      direction = 'up';
    }

    if (!direction) {
      this.gestureFeedback = null;
      return;
    }

    if (event.cancelable) {
      event.preventDefault();
    }
    this.suppressGroupClickUntil = Date.now() + 500;

    if (direction === 'left') {
      this.onRemoveEarlyPayment(start.group, event);
    } else if (direction === 'right') {
      this.onAddEarlyPayment(start.group, event);
    } else if (direction === 'down') {
      this.onDispatchInstalment(start.group, event);
    }

    this.showGestureFeedback(start.group, direction, true);
  }

  onMobileTouchCancel() {
    this.touchStart = null;
    this.gestureFeedback = null;
  }

  private showGestureFeedback(
    group: MonthlyInstalmentManager,
    direction: 'left' | 'right' | 'down' | 'up',
    clearAfter = false,
  ) {
    const labels = {
      left: 'Elimină rata anticipată',
      right: 'Adaugă rata anticipată',
      down: 'Marchează rata ca plătită',
      up: 'Gest anulat',
    };
    const feedback = { group, direction, label: labels[direction] };
    this.gestureFeedback = feedback;

    if (clearAfter) {
      setTimeout(() => {
        if (this.gestureFeedback === feedback) {
          this.gestureFeedback = null;
        }
      }, 650);
    }
  }

  toggleRow(row: LoanSimulatorInstalment) {
    row.instalmentPayment = !row.instalmentPayment;
  }

  getSubtotal(group: MonthlyInstalmentManager) {
    const instalments = group.instalments;
    const installment = instalments.find((s) => s.instalmentPayment);
    const early = instalments.filter((s) => s.earlyPayment);

    return {
      instalmentsCount: !!installment ? 1 : 0,
      instalment: installment?.totalInstalment ?? 0,
      earlyCount: early.length,
      principal: Calculator.sum(instalments.map((e) => e.principalAmount)),
      interest: installment?.interestAmount ?? 0,
      insurance: installment?.insuranceCost ?? 0,
      total: Calculator.sum(
        early
          .map((e) => e.principalAmount)
          .concat(installment?.totalInstalment ?? 0),
      ),
      earlyPayment: Calculator.sum(early.map((e) => e.principalAmount)),
      remaining: instalments?.at(-1)?.remainingBalance,
      count: instalments.length,
    };
  }

  onAddEarlyPayment(group: MonthlyInstalmentManager, event: Event) {
    this.store.toggleEarlyPayments([
      group.instalments?.at(-1)?.instalmentId + 1,
    ]);
  }

  onRemoveEarlyPayment(group: MonthlyInstalmentManager, event: Event) {
    const selectedEarlyPayments = this.store.selectedEarlyPayments();
    const instalmentId = [...group.instalments]
      .reverse()
      .find((instalment) =>
        selectedEarlyPayments.includes(instalment.instalmentId),
      )?.instalmentId;

    if (instalmentId !== undefined && instalmentId !== null) {
      return this.store.toggleEarlyPayments([instalmentId]);
    }

    const selectedNormalPayments = this.store.selectedInstalmentPayments();
    const normalInstalmentId = [...group.instalments]
      .reverse()
      .find((instalment) =>
        selectedNormalPayments.includes(instalment.instalmentId),
      )?.instalmentId;

    if (normalInstalmentId !== undefined && normalInstalmentId !== null) {
      return this.store.toggleInstalmentPayments([normalInstalmentId]);
    }
  }

  onDispatchInstalment(group: MonthlyInstalmentManager, event: Event) {
    this.store.toggleInstalmentPayments([
      group.instalments?.at(-1)?.instalmentId + 1,
    ]);
  }

  onSelectInstalmentPayment(instalment: LoanSimulatorInstalment) {
    this.store.toggleInstalmentPayments([instalment.instalmentId]);
  }

  onSelectEarlyPayment(instalment: LoanSimulatorInstalment) {
    this.store.toggleEarlyPayments([instalment.instalmentId]);
  }

  onExpandAll() {
    this.monthlyInstalmentGroups().forEach((group) => (group.expanded = true));
  }

  onCollapseAll() {
    this.monthlyInstalmentGroups().forEach((group) => (group.expanded = false));
  }

  expandState = true;

  onExpandOrCollapse() {
    this.expandState = !this.expandState;
    this.monthlyInstalmentGroups().forEach(
      (group) => (group.expanded = this.expandState),
    );
  }
}
