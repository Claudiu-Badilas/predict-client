import { TestBed } from '@angular/core/testing';
import { Overlay } from '@angular/cdk/overlay';
import { describe, expect, it, vi } from 'vitest';
import { LoanInsightsComponent } from './loan-simulator-insights.component';
import { expectComponentCreation } from 'src/app/testing/component-test-setup';

describe('LoanInsightsComponent', () => {
  it('should create', () => {
    expectComponentCreation(LoanInsightsComponent);
  });

  it('opens stories, pauses and resumes playback, and handles keyboard navigation', () => {
    expectComponentCreation(LoanInsightsComponent, (fixture) => {
      vi.useFakeTimers();
      try {
        const component = fixture.componentInstance;
        component.insightStories.push({
          eyebrow: 'Second story',
          title: 'Second loan insight',
          value: 'Two',
          detail: 'Second detail',
        });
        const overlay = TestBed.inject(Overlay) as unknown as {
          create: {
            mock: { calls: unknown[][]; results: { value: unknown }[] };
          };
        };
        component.handleStoryKeyboard(
          new KeyboardEvent('keydown', { key: 'ArrowRight' }),
        );
        expect(component.activeStory()).toBe(0);

        component.openInsights();
        expect(component.showInsights()).toBe(true);
        expect(component.activeStory()).toBe(0);
        const overlayRef = overlay.create.mock.results[0].value as {
          hasAttached: ReturnType<typeof vi.fn>;
          attach: ReturnType<typeof vi.fn>;
          dispose: ReturnType<typeof vi.fn>;
        };
        expect(overlayRef.attach).toHaveBeenCalledOnce();
        overlayRef.hasAttached.mockReturnValue(true);
        component.openInsights();
        expect(overlay.create.mock.results).toHaveLength(1);
        overlayRef.hasAttached.mockReturnValue(false);
        component.nextStory();
        expect(component.activeStory()).toBe(1);
        component.previousStory();
        expect(component.activeStory()).toBe(0);

        component.previousStory(true);
        expect(component.activeStory()).toBe(0);
        const performanceNow = vi.spyOn(performance, 'now').mockReturnValue(0);
        component.pauseStory(new PointerEvent('pointerdown', { button: 1 }));
        expect(component.isStoryPaused()).toBe(false);
        component.pauseStory(new PointerEvent('pointerdown', { button: 0 }));
        expect(component.isStoryPaused()).toBe(true);
        component.pauseStory(new PointerEvent('pointerdown', { button: 0 }));
        expect(component.isStoryPaused()).toBe(true);
        vi.advanceTimersByTime(300);
        performanceNow.mockReturnValue(300);
        component.resumeStory();
        performanceNow.mockRestore();
        expect(component.isStoryPaused()).toBe(false);
        component.nextStory(true);
        expect(component.showInsights()).toBe(true);
        component.resumeStory();

        component.handleStoryKeyboard(
          new KeyboardEvent('keydown', { key: 'ArrowLeft' }),
        );
        expect(component.activeStory()).toBe(0);
        component.handleStoryKeyboard(
          new KeyboardEvent('keydown', { key: 'ArrowRight' }),
        );
        expect(component.activeStory()).toBe(1);
        component.handleStoryKeyboard(
          new KeyboardEvent('keydown', { key: 'ArrowRight' }),
        );
        expect(component.showInsights()).toBe(false);
        expect(overlayRef.dispose).toHaveBeenCalledOnce();

        component.openInsights();
        component.pauseStory(new PointerEvent('pointerdown', { button: 0 }));
        component.resumeStory(true);
        expect(component.isStoryPaused()).toBe(false);
        component.handleStoryKeyboard(
          new KeyboardEvent('keydown', { key: 'Escape' }),
        );
        expect(component.showInsights()).toBe(false);
        component.closeInsights();
      } finally {
        vi.useRealTimers();
      }
    });
  });

  it('advances automatically and cancels its timer when destroyed', () => {
    expectComponentCreation(LoanInsightsComponent, (fixture) => {
      vi.useFakeTimers();
      try {
        const component = fixture.componentInstance;
        component.openInsights();
        vi.advanceTimersByTime(5000);
        expect(component.showInsights()).toBe(false);

        component.openInsights();
        const overlay = component as unknown as {
          overlayRef: { dispose: ReturnType<typeof vi.fn> };
        };
        const dispose = overlay.overlayRef.dispose;
        dispose.mockClear();
        component.ngOnDestroy();
        expect(dispose).toHaveBeenCalledOnce();
        vi.advanceTimersByTime(5000);
        expect(component.showInsights()).toBe(true);
      } finally {
        vi.useRealTimers();
      }
    });
  });
});
