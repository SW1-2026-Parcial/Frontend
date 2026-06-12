/*
 * MÓDULO: M1 Modelador
 * DESCRIPCIÓN: Paleta flotante de nodos — los ítems son draggables hacia el canvas.
 *              También expone los modos conectar/eliminar.
 */

import { Component, Input, Output, EventEmitter } from '@angular/core';
import { TipoNodo, TIPO_NODO_LABELS } from '../../../../shared/models/politica.model';

export interface ToolbarAccion {
  tipo: 'toggle-conectar' | 'toggle-eliminar' | 'agregar-calle' | 'ia-sugerir';
}

interface ItemPaleta {
  tipo: TipoNodo;
  label: string;
  grupo: 'flujo' | 'control' | 'paralelo' | 'tarea';
}

@Component({
  selector: 'app-toolbar-diagrama',
  standalone: false,
  templateUrl: './toolbar-diagrama.component.html',
  styleUrls: ['./toolbar-diagrama.component.scss'],
})
export class ToolbarDiagramaComponent {

  @Input()  modoConectar = false;
  @Input()  modoEliminar = false;
  @Output() accion = new EventEmitter<ToolbarAccion>();

  readonly items: ItemPaleta[] = [
    { tipo: 'START',    label: 'Inicio',         grupo: 'flujo'    },
    { tipo: 'END',      label: 'Fin',            grupo: 'flujo'    },
    { tipo: 'ACTIVITY', label: 'Actividad',       grupo: 'tarea'    },
    { tipo: 'DECISION', label: 'Decisión',        grupo: 'control'  },
    { tipo: 'MERGE',    label: 'Convergencia',    grupo: 'control'  },
    { tipo: 'FORK',     label: 'Paralelismo',     grupo: 'paralelo' },
    { tipo: 'JOIN',     label: 'Sincronización',  grupo: 'paralelo' },
  ];

  onDragStart(event: DragEvent, tipo: TipoNodo): void {
    event.dataTransfer?.setData('tipoNodo', tipo);
    if (event.dataTransfer) event.dataTransfer.effectAllowed = 'copy';
  }

  toggleConectar(): void { this.accion.emit({ tipo: 'toggle-conectar' }); }
  toggleEliminar(): void { this.accion.emit({ tipo: 'toggle-eliminar' }); }
  agregarCalle(): void   { this.accion.emit({ tipo: 'agregar-calle' });   }
  sugerirIA(): void      { this.accion.emit({ tipo: 'ia-sugerir' });      }
}
