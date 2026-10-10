import {
  AfterViewInit,
  Directive,
  ElementRef,
  HostBinding,
  OnDestroy,
  Renderer2,
} from '@angular/core';

@Directive({
  selector: '[scrollable]',
  standalone: true,
})
export class ScrollableDirective implements AfterViewInit, OnDestroy {
  @HostBinding('class.scrollable-container')
  readonly scrollableContainer = true;

  private readonly element: HTMLElement;
  private readonly verticalThumb: HTMLElement;
  private readonly horizontalThumb: HTMLElement;
  private removeScrollListener?: () => void;
  private removeResizeListener?: () => void;
  private resizeObserver?: ResizeObserver;
  private mutationObserver?: MutationObserver;
  private frameRequest?: number;

  constructor(
    elementRef: ElementRef<HTMLElement>,
    private readonly renderer: Renderer2,
  ) {
    this.element = elementRef.nativeElement;
    this.verticalThumb = this.createThumb('vertical');
    this.horizontalThumb = this.createThumb('horizontal');
  }

  ngAfterViewInit(): void {
    this.removeScrollListener = this.renderer.listen(
      this.element,
      'scroll',
      () => this.updateThumbs(),
    );
    this.removeResizeListener = this.renderer.listen('window', 'resize', () =>
      this.updateThumbs(),
    );
    this.resizeObserver = new ResizeObserver(() => this.updateThumbs());
    this.resizeObserver.observe(this.element);
    this.mutationObserver = new MutationObserver(() => this.updateThumbs());
    this.mutationObserver.observe(this.element, {
      childList: true,
      subtree: true,
      characterData: true,
    });
    this.updateThumbs();
  }

  ngOnDestroy(): void {
    this.removeScrollListener?.();
    this.removeResizeListener?.();
    this.resizeObserver?.disconnect();
    this.mutationObserver?.disconnect();
    if (this.frameRequest !== undefined) {
      cancelAnimationFrame(this.frameRequest);
    }
  }

  private createThumb(axis: 'vertical' | 'horizontal'): HTMLElement {
    const thumb = this.renderer.createElement('span') as HTMLElement;
    this.renderer.addClass(thumb, 'scrollable-thumb');
    this.renderer.addClass(thumb, `scrollable-thumb--${axis}`);
    this.renderer.setStyle(thumb, 'overflow-anchor', 'none');
    this.renderer.appendChild(this.element, thumb);
    return thumb;
  }

  private updateThumbs(): void {
    if (this.frameRequest !== undefined) return;

    this.frameRequest = requestAnimationFrame(() => {
      this.frameRequest = undefined;
      this.updateThumbsImmediately();
    });
  }

  private updateThumbsImmediately(): void {
    this.updateThumb(
      this.verticalThumb,
      this.element.clientHeight,
      this.element.scrollHeight,
      this.element.scrollTop,
      'height',
      'top',
    );
    this.updateThumb(
      this.horizontalThumb,
      this.element.clientWidth,
      this.element.scrollWidth,
      this.element.scrollLeft,
      'width',
      'left',
    );
  }

  private updateThumb(
    thumb: HTMLElement,
    viewportSize: number,
    contentSize: number,
    scrollOffset: number,
    sizeProperty: 'height' | 'width',
    positionProperty: 'top' | 'left',
  ): void {
    const isScrollable = contentSize > viewportSize + 1;
    this.renderer.setStyle(thumb, 'display', isScrollable ? 'block' : 'none');

    if (!isScrollable) return;

    const thumbSize = Math.max(24, (viewportSize * viewportSize) / contentSize);
    const travel = viewportSize - thumbSize;
    const maxScroll = contentSize - viewportSize;
    // The thumbs are children of the scrolling element. Keep them visually
    // attached to the viewport by compensating for the content's scroll
    // offset when positioning them.
    const position = maxScroll > 0 ? (scrollOffset / maxScroll) * travel : 0;

    this.renderer.setStyle(thumb, sizeProperty, `${thumbSize}px`);
    const translation = `${scrollOffset + position}px`;
    this.renderer.setStyle(
      thumb,
      'transform',
      positionProperty === 'top'
        ? `translate3d(0, ${translation}, 0)`
        : `translate3d(${translation}, 0, 0)`,
    );
  }
}
