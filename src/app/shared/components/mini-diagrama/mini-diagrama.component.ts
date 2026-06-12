import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NodoUML, Calle, NODO_DIM } from '../../models/politica.model';

export interface NodoCompletado {
  nodoId: string;
  taskId: string;
}

@Component({
  selector: 'app-mini-diagrama',
  standalone: false,
  templateUrl: './mini-diagrama.component.html',
  styleUrls: ['./mini-diagrama.component.scss'],
})
export class MiniDiagramaComponent {
  @Input() nodos: NodoUML[] = [];
  @Input() calles: Calle[] = [];
  @Input() nodoActualId: string | null = null;
  @Input() nodosCompletados: NodoCompletado[] = [];
  @Output() nodoClick = new EventEmitter<NodoCompletado>();

  readonly CANVAS_W = 2600;
  readonly LANE_H = 220;
  readonly NEUTRAL_H = 100;

  get totalHeight(): number {
    return this.NEUTRAL_H + this.calles.length * this.LANE_H + 20;
  }

  getNodoFill(nodo: NodoUML): string {
    if (nodo.nodoId === this.nodoActualId) return '#fbbf24';
    if (this.nodosCompletados.some(n => n.nodoId === nodo.nodoId)) return '#bbf7d0';
    return '#f3f4f6';
  }

  getNodoOpacity(nodo: NodoUML): number {
    if (nodo.nodoId === this.nodoActualId) return 1;
    return this.nodosCompletados.some(n => n.nodoId === nodo.nodoId) ? 1 : 0.4;
  }

  isClickable(nodo: NodoUML): boolean {
    return this.nodosCompletados.some(n => n.nodoId === nodo.nodoId);
  }

  onNodoClick(nodo: NodoUML): void {
    const completado = this.nodosCompletados.find(n => n.nodoId === nodo.nodoId);
    if (completado) this.nodoClick.emit(completado);
  }

  getConexionPath(origen: NodoUML, destino: NodoUML): string {
    const ow = NODO_DIM[origen.tipoNodo]?.w ?? 120;
    const oh = NODO_DIM[origen.tipoNodo]?.h ?? 40;
    const dw = NODO_DIM[destino.tipoNodo]?.w ?? 120;
    const dh = NODO_DIM[destino.tipoNodo]?.h ?? 40;
    const ox = origen.posicionCanvas.x + ow / 2;
    const oy = origen.posicionCanvas.y + oh / 2;
    const dx = destino.posicionCanvas.x + dw / 2;
    const dy = destino.posicionCanvas.y + dh / 2;
    const mid = (oy + dy) / 2;
    return `M ${ox} ${oy} C ${ox} ${mid}, ${dx} ${mid}, ${dx} ${dy}`;
  }

  getDestinoNodo(nodoId: string): NodoUML | undefined {
    return this.nodos.find(n => n.nodoId === nodoId);
  }

  getNodoW(nodo: NodoUML): number { return NODO_DIM[nodo.tipoNodo]?.w ?? 120; }
  getNodoH(nodo: NodoUML): number { return NODO_DIM[nodo.tipoNodo]?.h ?? 40; }
}
