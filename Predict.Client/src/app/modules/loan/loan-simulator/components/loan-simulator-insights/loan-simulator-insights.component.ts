import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  inject,
  OnDestroy,
  TemplateRef,
  ViewChild,
  ViewContainerRef,
  signal,
} from '@angular/core';

interface LoanInsight {
  eyebrow: string;
  title: string;
  value: string;
  detail: string;
}

@Component({
  selector: 'p-loan-insights',
  templateUrl: './loan-simulator-insights.component.html',
  styleUrl: './loan-simulator-insights.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoanInsightsComponent implements OnDestroy {
  private readonly overlay = inject(Overlay);
  private readonly viewContainerRef = inject(ViewContainerRef);
  @ViewChild('storyOverlay', { static: true })
  private storyOverlay!: TemplateRef<unknown>;

  readonly insightStories: LoanInsight[] = [
    {
      eyebrow: 'Asigurări',
      title: 'Actualizează polițele de asigurare',
      value: 'Înainte de 1 decembrie 2026',
      detail:
        'Verifică valabilitatea asigurărilor și actualizează informațiile necesare înainte de termen.',
    },
  ];

  showInsights = signal(false);
  activeStory = signal(0);
  isStoryPaused = signal(false);
  private storyTimer: ReturnType<typeof setTimeout> | null = null;
  private overlayRef: OverlayRef | null = null;
  private storyTimerDeadline = 0;
  private remainingStoryTime = 5000;
  private pointerHoldStartedAt = 0;
  private suppressStoryTap = false;

  openInsights(): void {
    if (this.overlayRef?.hasAttached()) return;
    this.activeStory.set(0);
    this.suppressStoryTap = false;
    this.showInsights.set(true);
    this.overlayRef = this.overlay.create({
      positionStrategy: this.overlay
        .position()
        .global()
        .top('0')
        .left('0')
        .width('100vw')
        .height('100dvh'),
      scrollStrategy: this.overlay.scrollStrategies.block(),
      panelClass: 'simulator-insights-overlay-pane',
    });
    this.overlayRef.attach(
      new TemplatePortal(this.storyOverlay, this.viewContainerRef),
    );
    this.scheduleNextStory();
  }

  closeInsights(): void {
    this.clearStoryTimer();
    this.isStoryPaused.set(false);
    this.suppressStoryTap = false;
    this.showInsights.set(false);
    this.overlayRef?.dispose();
    this.overlayRef = null;
  }

  previousStory(fromTap = false): void {
    if (fromTap && this.consumeSuppressedTap()) return;
    if (this.activeStory() === 0) return;
    this.activeStory.update((index) => index - 1);
    this.scheduleNextStory();
  }

  nextStory(fromTap = false): void {
    if (fromTap && this.consumeSuppressedTap()) return;
    if (this.activeStory() >= this.insightStories.length - 1) {
      this.closeInsights();
      return;
    }
    this.activeStory.update((index) => index + 1);
    this.scheduleNextStory();
  }

  pauseStory(event: PointerEvent): void {
    if (
      !this.showInsights() ||
      this.storyTimer === null ||
      event.button !== 0
    ) {
      return;
    }

    this.suppressStoryTap = false;
    this.pointerHoldStartedAt = performance.now();
    this.remainingStoryTime = Math.max(0, this.storyTimerDeadline - Date.now());
    this.clearStoryTimer();
    this.isStoryPaused.set(true);
  }

  resumeStory(cancelled = false): void {
    if (!this.isStoryPaused()) return;
    this.suppressStoryTap =
      !cancelled && performance.now() - this.pointerHoldStartedAt >= 250;
    this.isStoryPaused.set(false);
    this.startStoryTimer();
  }

  ngOnDestroy(): void {
    this.clearStoryTimer();
    this.overlayRef?.dispose();
  }

  @HostListener('document:keydown', ['$event'])
  handleStoryKeyboard(event: KeyboardEvent): void {
    if (!this.showInsights()) return;
    if (event.key === 'Escape') this.closeInsights();
    if (event.key === 'ArrowLeft') this.previousStory();
    if (event.key === 'ArrowRight') this.nextStory();
  }

  private scheduleNextStory(): void {
    this.clearStoryTimer();
    this.remainingStoryTime = 5000;
    this.startStoryTimer();
  }

  private startStoryTimer(): void {
    this.storyTimerDeadline = Date.now() + this.remainingStoryTime;
    this.storyTimer = setTimeout(() => {
      this.storyTimer = null;
      this.nextStory();
    }, this.remainingStoryTime);
  }

  private consumeSuppressedTap(): boolean {
    if (!this.suppressStoryTap) return false;
    this.suppressStoryTap = false;
    return true;
  }

  private clearStoryTimer(): void {
    if (this.storyTimer === null) return;
    clearTimeout(this.storyTimer);
    this.storyTimer = null;
  }
}
