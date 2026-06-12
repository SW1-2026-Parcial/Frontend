/*
 * MÓDULO: M1 Modelador
 * CASO DE USO: CU-02 a CU-06 — Ciclo de vida de políticas y versiones
 * ACTOR: Administrador
 */

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, finalize, catchError, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  Politica, VersionPolitica, DiagramaCompleto, ResultadoValidacion,
} from '../../../shared/models/politica.model';

@Injectable({ providedIn: 'root' })
export class PoliticaService {

  private readonly BASE = `${environment.apiUrl}/policies`;

  private politicasSubject      = new BehaviorSubject<Politica[]>([]);
  private politicaActualSubject = new BehaviorSubject<Politica | null>(null);
  private loadingSubject        = new BehaviorSubject<boolean>(false);

  politicas$      = this.politicasSubject.asObservable();
  politicaActual$ = this.politicaActualSubject.asObservable();
  loading$        = this.loadingSubject.asObservable();

  constructor(private http: HttpClient) {}

  // ── Políticas CRUD ──────────────────────────────────────────────────────────

  cargarPoliticas(): void {
    this.loadingSubject.next(true);
    this.http
      .get<Politica[]>(this.BASE)
      .pipe(finalize(() => this.loadingSubject.next(false)))
      .subscribe({
        next: lista => this.politicasSubject.next(lista),
        error: err  => console.error('[PoliticaService]', err),
      });
  }

  obtenerPorId(id: string): Observable<Politica> {
    return this.http.get<Politica>(`${this.BASE}/${id}`)
      .pipe(catchError(e => throwError(() => e)));
  }

  crear(datos: { nombre: string; descripcion: string | null }): Observable<Politica> {
    return this.http.post<Politica>(this.BASE, datos)
      .pipe(catchError(e => throwError(() => e)));
  }

  actualizar(id: string, datos: { nombre?: string | null; descripcion?: string | null }): Observable<Politica> {
    return this.http.put<Politica>(`${this.BASE}/${id}`, datos)
      .pipe(catchError(e => throwError(() => e)));
  }

  archivar(id: string): Observable<void> {
    return this.http.delete<void>(`${this.BASE}/${id}`)
      .pipe(catchError(e => throwError(() => e)));
  }

  // ── Versiones ───────────────────────────────────────────────────────────────

  obtenerVersiones(politicaId: string): Observable<VersionPolitica[]> {
    return this.http.get<VersionPolitica[]>(`${this.BASE}/${politicaId}/versions`)
      .pipe(catchError(e => throwError(() => e)));
  }

  crearVersion(politicaId: string): Observable<VersionPolitica> {
    return this.http.post<VersionPolitica>(`${this.BASE}/${politicaId}/versions`, null)
      .pipe(catchError(e => throwError(() => e)));
  }

  /** Devuelve el diagrama completo: version + calles[] + nodos[]. */
  obtenerDiagrama(politicaId: string, versionId: string): Observable<DiagramaCompleto> {
    return this.http.get<DiagramaCompleto>(`${this.BASE}/${politicaId}/versions/${versionId}/diagram`)
      .pipe(catchError(e => throwError(() => e)));
  }

  /** CU-05 — Valida consistencia estructural. Si es válido, `validado = true`. */
  validar(politicaId: string, versionId: string): Observable<ResultadoValidacion> {
    return this.http.post<ResultadoValidacion>(
      `${this.BASE}/${politicaId}/versions/${versionId}/validate`, null,
    ).pipe(catchError(e => throwError(() => e)));
  }

  /** CU-06 — Publica la versión (requiere validado=true). La versión se vuelve inmutable. */
  publicar(politicaId: string, versionId: string): Observable<VersionPolitica> {
    return this.http.post<VersionPolitica>(
      `${this.BASE}/${politicaId}/versions/${versionId}/publish`, null,
    ).pipe(catchError(e => throwError(() => e)));
  }

  /** CU-04 — Genera diagrama con IA. Responde con DiagramaCompleto (reemplaza todo el canvas). */
  generarConIA(
    politicaId: string,
    versionId: string,
    instruccion: string,
  ): Observable<DiagramaCompleto> {
    return this.http.post<DiagramaCompleto>(
      `${this.BASE}/${politicaId}/versions/${versionId}/ai-generate`,
      { instruccion },
    ).pipe(catchError(e => throwError(() => e)));
  }

  // ── Estado local ────────────────────────────────────────────────────────────

  agregarEnEstado(politica: Politica): void {
    this.politicasSubject.next([politica, ...this.politicasSubject.getValue()]);
  }

  actualizarEnEstado(politica: Politica): void {
    const lista = this.politicasSubject.getValue();
    const idx = lista.findIndex(p => p.id === politica.id);
    if (idx < 0) return;
    const actualizado = [...lista];
    actualizado[idx] = politica;
    this.politicasSubject.next(actualizado);
  }

  setPoliticaActual(politica: Politica | null): void {
    this.politicaActualSubject.next(politica);
  }
}
