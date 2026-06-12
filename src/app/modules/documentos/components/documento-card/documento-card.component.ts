import { Component, Input, Output, EventEmitter } from '@angular/core';
import {
  Documento,
  ICONOS_EXTENSION,
  COLORES_EXTENSION,
  formatearTamano,
} from '../../../../shared/models/documento.model';

@Component({
  selector: 'app-documento-card',
  standalone: false,
  templateUrl: './documento-card.component.html',
  styleUrls: ['./documento-card.component.scss'],
})
export class DocumentoCardComponent {
  @Input() documento!: Documento;
  @Output() editar = new EventEmitter<Documento>();
  @Output() descargar = new EventEmitter<Documento>();
  @Output() eliminar = new EventEmitter<Documento>();

  get icono(): string {
    return ICONOS_EXTENSION[this.documento.extension] || 'pi pi-file';
  }

  get color(): string {
    return COLORES_EXTENSION[this.documento.extension] || '#616161';
  }

  get tamano(): string {
    return formatearTamano(this.documento.tamano);
  }
}
