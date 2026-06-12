/*
 * MÓDULO: M1 Modelador
 * CASO DE USO: CU-02, CU-03, CU-05
 * ACTOR: Administrador
 * DESCRIPCIÓN: Canvas SVG — pizarra blanca con swim lanes, nodos arrastrables y
 *              conexiones bezier. Drop zone para la paleta flotante.
 */

import {
  Component, OnInit, OnDestroy, AfterViewInit,
  ElementRef, ViewChild, Input, Output, EventEmitter, NgZone, ChangeDetectorRef,
} from '@angular/core';
import { Subject, takeUntil } from 'rxjs';

import { DiagramaService } from '../../services/diagrama.service';
import {
  NodoUML, Calle, TipoNodo, NODO_DIM, LANE_COLORS,
} from '../../../../shared/models/politica.model';

// ── Constantes de layout ──────────────────────────────────────────────────────

const NEUTRAL_H   = 0;     // zona neutra eliminada — nodos de control flotan libremente en el canvas
const LANE_H      = 220;   // altura de cada swim lane
const LANE_LABEL_W = 44;   // ancho de la franja de etiqueta de cada calle
const CANVAS_W    = 2600;  // ancho total del SVG (scrollable)
const GRID_SIZE   = 24;    // espaciado del grid de puntos

type ConexionCanvas = {
  nodoOrigenId: string;
  nodoDestinoId: string;
  rama: boolean;
  etiqueta?: string | null;
};

// ── Componente ────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-canvas',
  standalone: false,
  templateUrl: './canvas.component.html',
  styleUrls: ['./canvas.component.scss'],
})
export class CanvasComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('wrap', { static: true }) wrapRef!: ElementRef<HTMLDivElement>;

  @Input() readonly    = false;
  @Input() modoConectar = false;
  @Input() modoEliminar = false;

  @Output() nodoCreadoRequest = new EventEmitter<{
    tipoNodo: TipoNodo; x: number; y: number; calleId: string | null;
  }>();
  @Output() conexionSolicitada  = new EventEmitter<{ origen: NodoUML; destino: NodoUML }>();
  @Output() nodoEditarRequest   = new EventEmitter<NodoUML>();
  @Output() calleEditarRequest  = new EventEmitter<Calle>();

  nodos:  NodoUML[] = [];
  calles: Calle[]   = [];

  readonly NEUTRAL_H    = NEUTRAL_H;
  readonly LANE_H       = LANE_H;
  readonly LANE_LABEL_W = LANE_LABEL_W;
  readonly CANVAS_W     = CANVAS_W;
  readonly LANE_COLORS  = LANE_COLORS;

  nodoOrigenPendiente: NodoUML | null = null;

  /** Altura mínima observada del contenedor wrap — evita que el SVG quede más corto que la pantalla. */
  wrapH = 600;

  private dragging: { nodo: NodoUML; offsetX: number; offsetY: number; startX: number; startY: number } | null = null;
  private hasDragged = false;
  private destroy$ = new Subject<void>();
  private resizeObserver?: ResizeObserver;

  constructor(
    private diagramaService: DiagramaService,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef,
  ) {}

  // ── Lifecycle ───────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.diagramaService.estado$
      .pipe(takeUntil(this.destroy$))
      .subscribe(estado => {
        this.nodos  = estado.nodos  ?? [];
        this.calles = estado.calles ?? [];
        this.cdr.detectChanges();
      });
  }

  ngAfterViewInit(): void {
    // Force layout recomputation — sin esto el canvas aparece en blanco al cargarse.
    requestAnimationFrame(() => window.dispatchEvent(new Event('resize')));

    // Observar cambios de tamaño del wrap para que el SVG nunca sea más corto
    // que el área visible. ResizeObserver corre FUERA del NgZone — ngZone.run()
    // es obligatorio para que Angular detecte el cambio de wrapH y re-renderice.
    this.resizeObserver = new ResizeObserver(entries => {
      const h = entries[0]?.contentRect.height ?? 0;
      if (h > 0) this.ngZone.run(() => { this.wrapH = h; });
    });
    this.resizeObserver.observe(this.wrapRef.nativeElement);
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Geometría ───────────────────────────────────────────────────────────────

  get canvasHeight(): number {
    const contentH = NEUTRAL_H + Math.max(1, this.calles.length) * LANE_H + 60;
    // El SVG nunca es más corto que el área visible del wrap para evitar
    // que nodos dropeados en la parte baja queden fuera de los límites del SVG.
    return Math.max(contentH, this.wrapH);
  }

  laneY(idx: number): number {
    return NEUTRAL_H + idx * LANE_H;
  }

  laneColor(idx: number): string {
    return LANE_COLORS[idx % LANE_COLORS.length];
  }

  dim(tipo: TipoNodo) {
    return NODO_DIM[tipo];
  }

  nodoCx(nodo: NodoUML): number {
    return nodo.posicionCanvas.x + NODO_DIM[nodo.tipoNodo].w / 2;
  }

  nodoCy(nodo: NodoUML): number {
    return nodo.posicionCanvas.y + NODO_DIM[nodo.tipoNodo].h / 2;
  }

  // ── Conexiones derivadas ────────────────────────────────────────────────────

  get conexiones(): ConexionCanvas[] {
    const out: ConexionCanvas[] = [];
    for (const n of this.nodos) {
      for (const s of n.salidas ?? []) {
        out.push({ nodoOrigenId: n.nodoId, nodoDestinoId: s.nodoDestino, rama: s.rama, etiqueta: s.etiqueta });
      }
    }
    return out;
  }

  getConexionPath(conn: ConexionCanvas): string {
    const src = this.nodos.find(n => n.nodoId === conn.nodoOrigenId);
    const dst = this.nodos.find(n => n.nodoId === conn.nodoDestinoId);
    if (!src || !dst) return '';

    const sD = NODO_DIM[src.tipoNodo];
    const dD = NODO_DIM[dst.tipoNodo];

    const srcCx = src.posicionCanvas.x + sD.w / 2;
    const srcCy = src.posicionCanvas.y + sD.h / 2;
    const dstCx = dst.posicionCanvas.x + dD.w / 2;
    const dstCy = dst.posicionCanvas.y + dD.h / 2;

    const dx = dstCx - srcCx;
    const dy = dstCy - srcCy;

    let sx: number, sy: number, ex: number, ey: number;
    let cp1x: number, cp1y: number, cp2x: number, cp2y: number;

    if (Math.abs(dy) >= Math.abs(dx)) {
      // Flujo vertical
      if (dy > 0) {
        sx = srcCx; sy = src.posicionCanvas.y + sD.h;
        ex = dstCx; ey = dst.posicionCanvas.y;
      } else {
        // Bucle hacia arriba — sale por el lateral
        sx = src.posicionCanvas.x + sD.w; sy = srcCy;
        ex = dst.posicionCanvas.x + dD.w; ey = dstCy;
      }
      const curve = Math.max(60, Math.abs(dy) * 0.45);
      cp1x = sx; cp1y = sy + (dy > 0 ? curve : -curve);
      cp2x = ex; cp2y = ey - (dy > 0 ? curve : -curve);
    } else {
      // Flujo horizontal
      if (dx > 0) {
        sx = src.posicionCanvas.x + sD.w; sy = srcCy;
        ex = dst.posicionCanvas.x;        ey = dstCy;
      } else {
        sx = src.posicionCanvas.x; sy = srcCy;
        ex = dst.posicionCanvas.x + dD.w; ey = dstCy;
      }
      const curve = Math.max(60, Math.abs(dx) * 0.45);
      cp1x = sx + (dx > 0 ? curve : -curve); cp1y = sy;
      cp2x = ex - (dx > 0 ? curve : -curve); cp2y = ey;
    }

    return `M ${sx} ${sy} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${ex} ${ey}`;
  }

  getMidpoint(conn: ConexionCanvas): { x: number; y: number } | null {
    const path = this.getConexionPath(conn);
    if (!path) return null;
    const parts = path.replace('M ', '').split(' C ');
    if (parts.length < 2) return null;
    const [mx, my] = parts[0].split(' ').map(Number);
    const endParts  = parts[1].split(', ');
    const endCoords = endParts[2]?.split(' ').map(Number) ?? [];
    if (endCoords.length < 2) return null;
    return { x: (mx + endCoords[0]) / 2, y: (my + endCoords[1]) / 2 };
  }

  // ── Drag & Drop desde paleta (HTML5 DnD API) ────────────────────────────────

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    const tipoNodo = event.dataTransfer?.getData('tipoNodo') as TipoNodo;
    if (!tipoNodo) return;

    const rect = this.wrapRef.nativeElement.getBoundingClientRect();
    const scrollLeft = this.wrapRef.nativeElement.scrollLeft;
    const scrollTop  = this.wrapRef.nativeElement.scrollTop;
    const x = event.clientX - rect.left + scrollLeft - NODO_DIM[tipoNodo].w / 2;
    const y = event.clientY - rect.top  + scrollTop  - NODO_DIM[tipoNodo].h / 2;
    const calleId = this.resolveCalleId(y, tipoNodo);

    this.nodoCreadoRequest.emit({ tipoNodo, x: Math.max(LANE_LABEL_W + 8, x), y: Math.max(0, y), calleId });
  }

  private resolveCalleId(y: number, tipo: TipoNodo): string | null {
    // Nodos de control (START, END, DECISION, MERGE, FORK, JOIN) nunca pertenecen
    // a ninguna calle — calleId siempre null independientemente de su posición.
    const controlNodes: TipoNodo[] = ['START', 'END', 'DECISION', 'MERGE', 'FORK', 'JOIN'];
    if (controlNodes.includes(tipo)) return null;

    // Nodos ACTIVITY: calle determinada por la posición Y en el canvas.
    const idx = Math.floor(y / LANE_H);
    return this.calles[idx]?.calleId ?? null;
  }

  // ── Drag de nodos existentes ────────────────────────────────────────────────

  onNodoMouseDown(event: MouseEvent, nodo: NodoUML): void {
    if (this.readonly || this.modoConectar || this.modoEliminar) return;
    event.preventDefault();
    event.stopPropagation();

    const rect = this.wrapRef.nativeElement.getBoundingClientRect();
    const scrollLeft = this.wrapRef.nativeElement.scrollLeft;
    const scrollTop  = this.wrapRef.nativeElement.scrollTop;

    this.hasDragged = false;
    this.dragging = {
      nodo,
      offsetX: event.clientX - rect.left + scrollLeft - nodo.posicionCanvas.x,
      offsetY: event.clientY - rect.top  + scrollTop  - nodo.posicionCanvas.y,
      startX:  event.clientX,
      startY:  event.clientY,
    };
  }

  onCanvasMouseMove(event: MouseEvent): void {
    if (!this.dragging) return;

    // Detectar si el movimiento supera el umbral de 5px para distinguir drag de click
    if (!this.hasDragged) {
      const dx = event.clientX - this.dragging.startX;
      const dy = event.clientY - this.dragging.startY;
      if (Math.sqrt(dx * dx + dy * dy) > 5) {
        this.hasDragged = true;
      } else {
        return;
      }
    }

    const rect = this.wrapRef.nativeElement.getBoundingClientRect();
    const scrollLeft = this.wrapRef.nativeElement.scrollLeft;
    const scrollTop  = this.wrapRef.nativeElement.scrollTop;

    const x = Math.max(LANE_LABEL_W + 4, event.clientX - rect.left + scrollLeft - this.dragging.offsetX);
    const y = Math.max(0, event.clientY - rect.top  + scrollTop  - this.dragging.offsetY);

    const nodoMovido: NodoUML = { ...this.dragging.nodo, posicionCanvas: { x, y } };
    this.dragging.nodo = nodoMovido;
    this.diagramaService.actualizarNodoEnEstado(nodoMovido);
  }

  onCanvasMouseUp(): void {
    if (!this.dragging) return;

    const nodo = this.dragging.nodo;
    const wasDragging = this.hasDragged;
    this.dragging = null;

    if (!wasDragging) return; // fue un click simple, no un drag — no persistir posición

    const calleId = this.resolveCalleId(nodo.posicionCanvas.y, nodo.tipoNodo);
    this.diagramaService.actualizarNodo(nodo.nodoId, {
      posicionCanvas: nodo.posicionCanvas,
      calleId,
    }).subscribe({
      next: actualizado => this.diagramaService.actualizarNodoEnEstado(actualizado),
      error: () => {},
    });
  }

  // ── Clicks ──────────────────────────────────────────────────────────────────

  onNodoClick(event: MouseEvent, nodo: NodoUML): void {
    event.stopPropagation();
    if (this.readonly) return;
    // Si el usuario arrastró más de 5px, ignorar el click (era un drag)
    if (this.hasDragged) { this.hasDragged = false; return; }

    if (this.modoEliminar) {
      this.diagramaService.eliminarNodo(nodo.nodoId).subscribe({
        next: () => this.diagramaService.eliminarNodoDeEstado(nodo.nodoId),
        error: () => {},
      });
      return;
    }

    if (this.modoConectar) {
      if (!this.nodoOrigenPendiente) {
        this.nodoOrigenPendiente = nodo;
        this.diagramaService.seleccionarNodo(nodo);
      } else if (this.nodoOrigenPendiente.nodoId !== nodo.nodoId) {
        this.conexionSolicitada.emit({ origen: this.nodoOrigenPendiente, destino: nodo });
        this.nodoOrigenPendiente = null;
        this.diagramaService.seleccionarNodo(null);
      }
      return;
    }

    this.diagramaService.seleccionarNodo(nodo);
    this.nodoEditarRequest.emit(nodo);
  }

  onConexionClick(event: MouseEvent, conn: ConexionCanvas): void {
    event.preventDefault();
    event.stopPropagation();
    if (this.readonly || !this.modoEliminar) return;

    this.diagramaService.desconectar(conn.nodoOrigenId, conn.nodoDestinoId).subscribe({
      error: () => {},
    });
  }

  onCanvasClick(): void {
    if (this.modoConectar) { this.nodoOrigenPendiente = null; return; }
    if (!this.modoEliminar) this.diagramaService.seleccionarNodo(null);
  }

  onCalleClick(event: MouseEvent, calle: Calle): void {
    event.stopPropagation();
    if (this.readonly || this.modoConectar || this.modoEliminar) return;
    this.calleEditarRequest.emit(calle);
  }

  cancelarConexion(): void {
    this.nodoOrigenPendiente = null;
  }

  // ── CSS helpers ─────────────────────────────────────────────────────────────

  get nodoSeleccionadoId(): string | null {
    return this.diagramaService.getEstadoSnapshot().nodoSeleccionado?.nodoId ?? null;
  }

  isSeleccionado(nodoId: string): boolean {
    return this.nodoSeleccionadoId === nodoId;
  }

  isOrigenPendiente(nodoId: string): boolean {
    return this.nodoOrigenPendiente?.nodoId === nodoId;
  }
}
