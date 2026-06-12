import { Component, Input, Output, EventEmitter } from '@angular/core';

export interface TableColumn {
  key: string;
  header: string;
  type: 'text' | 'date' | 'status' | 'badge' | 'actions' | 'boolean' | 'number';
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

@Component({
  selector: 'app-sp1-table',
  standalone: false,
  templateUrl: './sp1-table.component.html',
  styleUrls: ['./sp1-table.component.scss'],
})
export class Sp1TableComponent {
  @Input() columns: TableColumn[] = [];
  @Input() data: unknown[] | null = [];
  @Input() loading = false;
  @Input() emptyMessage = 'No hay registros disponibles';
  @Input() paginator = true;
  @Input() rows = 10;
  @Input() rowsPerPageOptions = [5, 10, 25, 50];
  @Input() caption?: string;

  @Output() rowClick = new EventEmitter<unknown>();
  @Output() actionClick = new EventEmitter<{ action: string; row: unknown }>();

  /** Soporta dot notation (e.g. 'cliente.nombre'). */
  getCellValue(row: unknown, key: string): unknown {
    return key.split('.').reduce((obj, k) => {
      return obj && typeof obj === 'object' ? (obj as Record<string, unknown>)[k] : undefined;
    }, row);
  }

  onAction(action: string, row: unknown, event: Event): void {
    event.stopPropagation();
    this.actionClick.emit({ action, row });
  }

  get skeletonRows(): number[] {
    return Array(this.rows).fill(0).map((_, i) => i);
  }
}
