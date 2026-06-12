import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-sp1-empty-state',
  standalone: false,
  templateUrl: './sp1-empty-state.component.html',
  styleUrls: ['./sp1-empty-state.component.scss'],
})
export class Sp1EmptyStateComponent {
  @Input() icon = 'pi pi-inbox';
  @Input() title = 'Sin resultados';
  @Input() message = '';
  @Input() actionLabel?: string;
  @Input() actionIcon = 'pi pi-plus';

  @Output() actionClick = new EventEmitter<void>();
}
