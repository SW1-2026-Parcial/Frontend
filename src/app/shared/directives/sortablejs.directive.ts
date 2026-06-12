import {
  AfterViewInit, Directive, ElementRef, EventEmitter, Input, OnDestroy, Output
} from '@angular/core';
import Sortable, { Options, SortableEvent } from 'sortablejs';

@Directive({ selector: '[appSortablejs]', standalone: false })
export class SortablejsDirective implements AfterViewInit, OnDestroy {
  @Input('appSortablejsOptions') options: Options = {};
  @Output() sortablejsEnd = new EventEmitter<{ oldIndex: number; newIndex: number }>();

  private sortable: Sortable | null = null;

  constructor(private el: ElementRef<HTMLElement>) {}

  ngAfterViewInit(): void {
    const consumerOnEnd = this.options.onEnd;
    this.sortable = Sortable.create(this.el.nativeElement, {
      ...this.options,
      onEnd: (evt: SortableEvent) => {
        if (evt.oldIndex !== undefined && evt.newIndex !== undefined) {
          this.sortablejsEnd.emit({ oldIndex: evt.oldIndex, newIndex: evt.newIndex });
        }
        consumerOnEnd?.(evt);
      },
    });
  }

  ngOnDestroy(): void {
    this.sortable?.destroy();
    this.sortable = null;
  }
}
