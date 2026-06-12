/*
 * MÓDULO: M1 Modelador
 * CASO DE USO: CU-02, CU-03, CU-04, CU-05
 * ACTOR: Administrador
 * DESCRIPCIÓN: Estado reactivo del editor — sincroniza nodos y calles con el backend.
 */

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  BehaviorSubject, Observable,
  catchError, tap, throwError,
} from 'rxjs';
import {
  NodoUML, Calle, TipoNodo, SalidaNodo, CampoDefinicion,
} from '../../../shared/models/politica.model';
import { environment } from '../../../../environments/environment';

// ── Estado interno ────────────────────────────────────────────────────────────

interface EstadoEditor {
  versionId: string | null;
  nodos: NodoUML[];
  calles: Calle[];
  nodoSeleccionado: NodoUML | null;
}

const ESTADO_VACIO: EstadoEditor = {
  versionId: null,
  nodos: [],
  calles: [],
  nodoSeleccionado: null,
};

// ── Servicio ──────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class DiagramaService {

  private readonly BASE_V = `${environment.apiUrl}/versions`;

  private estadoSubject  = new BehaviorSubject<EstadoEditor>(ESTADO_VACIO);
  nodoSeleccionado$      = new BehaviorSubject<NodoUML | null>(null);

  estado$ = this.estadoSubject.asObservable();

  constructor(private http: HttpClient) {}

  // ── Inicialización ──────────────────────────────────────────────────────────

  inicializar(versionId: string, nodos: NodoUML[], calles: Calle[]): void {
    this.estadoSubject.next({ versionId, nodos, calles, nodoSeleccionado: null });
    this.nodoSeleccionado$.next(null);
  }

  limpiar(): void {
    this.estadoSubject.next(ESTADO_VACIO);
    this.nodoSeleccionado$.next(null);
  }

  // ── API: Nodos ──────────────────────────────────────────────────────────────

  crearNodo(
    tipoNodo: TipoNodo,
    etiqueta: string,
    x: number,
    y: number,
    calleId: string | null,
  ): Observable<NodoUML> {
    const versionId = this.requireVersionId();
    return this.http
      .post<NodoUML>(`${this.BASE_V}/${versionId}/nodes`, {
        tipoNodo,
        etiqueta,
        posicionCanvas: { x, y },
        calleId,
      })
      .pipe(catchError(e => throwError(() => e)));
  }

  actualizarNodo(
    nodoId: string,
    cambios: {
      etiqueta?: string | null;
      posicionCanvas?: { x: number; y: number };
      calleId?: string | null;
      salidas?: SalidaNodo[];
    },
  ): Observable<NodoUML> {
    const versionId = this.requireVersionId();
    return this.http
      .put<NodoUML>(`${this.BASE_V}/${versionId}/nodes/${nodoId}`, cambios)
      .pipe(catchError(e => throwError(() => e)));
  }

  configurarNodo(
    nodoId: string,
    config: {
      formulario: CampoDefinicion[];
      instruccionAvance?: string | null;
      instruccionRechazo?: string | null;
    },
  ): Observable<NodoUML> {
    const versionId = this.requireVersionId();
    return this.http
      .patch<NodoUML>(`${this.BASE_V}/${versionId}/nodes/${nodoId}/configure`, config)
      .pipe(catchError(e => throwError(() => e)));
  }

  eliminarNodo(nodoId: string): Observable<void> {
    const versionId = this.requireVersionId();
    return this.http
      .delete<void>(`${this.BASE_V}/${versionId}/nodes/${nodoId}`)
      .pipe(catchError(e => throwError(() => e)));
  }

  // ── API: Conexiones ─────────────────────────────────────────────────────────

  conectar(
    nodoOrigenId: string,
    nodoDestinoId: string,
    rama: boolean,
    etiqueta?: string | null,
  ): Observable<NodoUML> {
    const versionId = this.requireVersionId();
    return this.http
      .post<NodoUML>(`${this.BASE_V}/${versionId}/connections`, {
        origenNodoId: nodoOrigenId,
        destinoNodoId: nodoDestinoId,
        rama,
        etiqueta: etiqueta ?? null,
      })
      .pipe(
        tap(origenActualizado => this.actualizarNodoEnEstado(origenActualizado)),
        catchError(e => throwError(() => e)),
      );
  }

  desconectar(nodoOrigenId: string, nodoDestinoId: string): Observable<void> {
    const versionId = this.requireVersionId();
    return this.http
      .delete<void>(`${this.BASE_V}/${versionId}/connections/${nodoOrigenId}/${nodoDestinoId}`)
      .pipe(
        tap(() => this.quitarConexionEnEstado(nodoOrigenId, nodoDestinoId)),
        catchError(e => throwError(() => e)),
      );
  }

  // ── API: Calles ─────────────────────────────────────────────────────────────

  crearCalle(datos: {
    nombre: string;
    departamentoId?: string | null;
    posicionCanvas: { x: number; y: number };
    dimensiones: { ancho: number; alto: number };
    orden: number;
  }): Observable<Calle> {
    const versionId = this.requireVersionId();
    return this.http
      .post<Calle>(`${this.BASE_V}/${versionId}/lanes`, datos)
      .pipe(
        tap(calle => this.agregarCalleEnEstado(calle)),
        catchError(e => throwError(() => e)),
      );
  }

  actualizarCalle(calleId: string, cambios: Partial<{
    nombre: string;
    departamentoId: string | null;
    posicionCanvas: { x: number; y: number };
    dimensiones: { ancho: number; alto: number };
    orden: number;
  }>): Observable<Calle> {
    const versionId = this.requireVersionId();
    return this.http
      .patch<Calle>(`${this.BASE_V}/${versionId}/lanes/${calleId}`, cambios)
      .pipe(
        tap(calle => this.actualizarCalleEnEstado(calle)),
        catchError(e => throwError(() => e)),
      );
  }

  eliminarCalle(calleId: string): Observable<void> {
    const versionId = this.requireVersionId();
    return this.http
      .delete<void>(`${this.BASE_V}/${versionId}/lanes/${calleId}`)
      .pipe(
        tap(() => this.eliminarCalleDeEstado(calleId)),
        catchError(e => throwError(() => e)),
      );
  }

  // ── Mutaciones de estado local ──────────────────────────────────────────────

  agregarNodoEnEstado(nodo: NodoUML): void {
    const s = this.estadoSubject.getValue();
    this.estadoSubject.next({ ...s, nodos: [...s.nodos, nodo] });
  }

  actualizarNodoEnEstado(nodo: NodoUML): void {
    const s = this.estadoSubject.getValue();
    const nodos = s.nodos.map(n => n.nodoId === nodo.nodoId ? nodo : n);
    const seleccionado = s.nodoSeleccionado?.nodoId === nodo.nodoId ? nodo : s.nodoSeleccionado;
    this.estadoSubject.next({ ...s, nodos, nodoSeleccionado: seleccionado });
    if (s.nodoSeleccionado?.nodoId === nodo.nodoId) this.nodoSeleccionado$.next(nodo);
  }

  eliminarNodoDeEstado(nodoId: string): void {
    const s = this.estadoSubject.getValue();
    const nodos = s.nodos
      .filter(n => n.nodoId !== nodoId)
      .map(n => ({ ...n, salidas: n.salidas.filter(sa => sa.nodoDestino !== nodoId) }));
    const seleccionado = s.nodoSeleccionado?.nodoId === nodoId ? null : s.nodoSeleccionado;
    this.estadoSubject.next({ ...s, nodos, nodoSeleccionado: seleccionado });
    if (seleccionado === null) this.nodoSeleccionado$.next(null);
  }

  quitarConexionEnEstado(nodoOrigenId: string, nodoDestinoId: string): void {
    const s = this.estadoSubject.getValue();
    const nodos = s.nodos.map(n => {
      if (n.nodoId !== nodoOrigenId) return n;
      return { ...n, salidas: n.salidas.filter(sa => sa.nodoDestino !== nodoDestinoId) };
    });
    this.estadoSubject.next({ ...s, nodos });
  }

  agregarCalleEnEstado(calle: Calle): void {
    const s = this.estadoSubject.getValue();
    this.estadoSubject.next({ ...s, calles: [...s.calles, calle] });
  }

  actualizarCalleEnEstado(calle: Calle): void {
    const s = this.estadoSubject.getValue();
    const calles = s.calles.map(c => c.calleId === calle.calleId ? calle : c);
    this.estadoSubject.next({ ...s, calles });
  }

  eliminarCalleDeEstado(calleId: string): void {
    const s = this.estadoSubject.getValue();
    const calles = s.calles.filter(c => c.calleId !== calleId);
    this.estadoSubject.next({ ...s, calles });
  }

  // ── Selección ───────────────────────────────────────────────────────────────

  seleccionarNodo(nodo: NodoUML | null): void {
    const s = this.estadoSubject.getValue();
    this.estadoSubject.next({ ...s, nodoSeleccionado: nodo });
    this.nodoSeleccionado$.next(nodo);
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  getEstadoSnapshot(): EstadoEditor {
    return this.estadoSubject.getValue();
  }

  private requireVersionId(): string {
    const id = this.estadoSubject.getValue().versionId;
    if (!id) throw new Error('[DiagramaService] No hay versionId activo. Llama inicializar() primero.');
    return id;
  }
}
