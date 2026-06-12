import { Component, Input } from '@angular/core';
import { NodoUML, Calle, NODO_DIM } from '../../../../shared/models/politica.model';

export interface BottleneckInfo {
  nodoId: string;    // mapped from BottleneckResponse.nodeId
  etiqueta: string;
  ranking: number;
  promedioMs: number;
}

@Component({
  selector:    'app-canvas-readonly',
  standalone:  false,
  templateUrl: './canvas-readonly.component.html'
})
export class CanvasReadonlyComponent {
  @Input() nodos: NodoUML[] = [];
  @Input() calles: Calle[] = [];
  @Input() modoAnalitica = false;
  @Input() bottlenecks: BottleneckInfo[] = [];

  readonly CANVAS_W = 2600;
  readonly LANE_H = 220;
  readonly NEUTRAL_H = 100;

  get totalHeight(): number {
    return this.NEUTRAL_H + this.calles.length * this.LANE_H + 20;
  }

  getNodoFill(nodo: NodoUML): string {
    if (!this.modoAnalitica || nodo.tipoNodo !== 'ACTIVITY') {
      return this.getDefaultFill(nodo);
    }
    return this.getHeatColor(nodo.nodoId);
  }

  private getDefaultFill(nodo: NodoUML): string {
    const fills: Record<string, string> = {
      START:    '#374151',
      END:      '#111827',
      ACTIVITY: '#dbeafe',
      DECISION: '#fef3c7',
      MERGE:    '#f3f4f6',
      FORK:     '#374151',
      JOIN:     '#374151'
    };
    return fills[nodo.tipoNodo] ?? '#f3f4f6';
  }

  private getHeatColor(nodoId: string): string {
    const b = this.bottlenecks.find(b => b.nodoId === nodoId);
    if (!b) return '#e5e7eb';
    const total = this.bottlenecks.length;
    const ratio = total === 1 ? 0 : (b.ranking - 1) / (total - 1);
    return this.interpolateColor('#ef4444', '#22c55e', ratio);
  }

  private interpolateColor(c1: string, c2: string, ratio: number): string {
    const r1 = parseInt(c1.slice(1, 3), 16);
    const g1 = parseInt(c1.slice(3, 5), 16);
    const b1 = parseInt(c1.slice(5, 7), 16);
    const r2 = parseInt(c2.slice(1, 3), 16);
    const g2 = parseInt(c2.slice(3, 5), 16);
    const b2 = parseInt(c2.slice(5, 7), 16);
    const r  = Math.round(r1 + (r2 - r1) * ratio);
    const g  = Math.round(g1 + (g2 - g1) * ratio);
    const b  = Math.round(b1 + (b2 - b1) * ratio);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  getRanking(nodoId: string): number | null {
    return this.bottlenecks.find(b => b.nodoId === nodoId)?.ranking ?? null;
  }

  getTooltip(nodo: NodoUML): string {
    if (!this.modoAnalitica) return nodo.etiqueta;
    const b = this.bottlenecks.find(b => b.nodoId === nodo.nodoId);
    if (!b) return nodo.etiqueta;
    const min = (b.promedioMs / 60000).toFixed(1);
    return `${nodo.etiqueta}\nRanking: #${b.ranking}\nPromedio: ${min} min`;
  }

  getConexionPath(origen: NodoUML, destino: NodoUML): string {
    const ow = NODO_DIM[origen.tipoNodo]?.w ?? 120;
    const oh = NODO_DIM[origen.tipoNodo]?.h ?? 40;
    const dw = NODO_DIM[destino.tipoNodo]?.w ?? 120;
    const ox  = origen.posicionCanvas.x + ow / 2;
    const oy  = origen.posicionCanvas.y + oh;
    const dx  = destino.posicionCanvas.x + dw / 2;
    const dy  = destino.posicionCanvas.y;
    const mid = (oy + dy) / 2;
    return `M ${ox} ${oy} C ${ox} ${mid}, ${dx} ${mid}, ${dx} ${dy}`;
  }

  getDestinoNodo(nodoId: string): NodoUML | undefined {
    return this.nodos.find(n => n.nodoId === nodoId);
  }
}
