import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

import {
  Documento,
  DocumentoDetalle,
  DocumentoEvent,
  DownloadUrlResponse,
  EditUrlResponse,
  UpdatePermisosRequest,
} from '../../../shared/models/documento.model';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class DocumentoService {

  private readonly BASE = `${environment.apiUrl}/documentos`;

  private documentosSubject = new BehaviorSubject<Documento[]>([]);
  private loadingSubject    = new BehaviorSubject<boolean>(false);

  documentos$ = this.documentosSubject.asObservable();
  loading$    = this.loadingSubject.asObservable();

  constructor(private http: HttpClient) {}

  // ── Árbol jerárquico (lazy) ─────────────────────────────────────────────────

  obtenerArbol(): Observable<any[]> {
    return this.http.get<any[]>(`${this.BASE}/tree`);
  }

  treePoliticas(): Observable<any[]> {
    return this.http.get<any[]>(`${this.BASE}/tree/politicas`);
  }

  treeTramites(politicaId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.BASE}/tree/tramites/${politicaId}`);
  }

  treeDocumentos(tramiteId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.BASE}/tree/documentos/${tramiteId}`);
  }

  // ── Lista paginada ──────────────────────────────────────────────────────────

  obtenerListaPaginada(page = 1, perPage = 15): Observable<{ data: Documento[]; total: number; page: number; pages: number }> {
    return this.http.get<any>(`${this.BASE}?page=${page}&per_page=${perPage}`);
  }

  obtenerListaPlana(): Observable<Documento[]> {
    return this.http.get<Documento[]>(this.BASE);
  }

  // ── Listado ────────────────────────────────────────────────────────────────

  cargarDocumentos(filtros?: {
    politicaId?: string;
    tramiteId?: string;
    clienteId?: string;
  }): void {
    this.loadingSubject.next(true);
    let params = new HttpParams();
    if (filtros?.politicaId) params = params.set('politicaId', filtros.politicaId);
    if (filtros?.tramiteId)  params = params.set('tramiteId',  filtros.tramiteId);
    if (filtros?.clienteId)  params = params.set('clienteId',  filtros.clienteId);

    this.http.get<Documento[]>(this.BASE, { params }).subscribe({
      next: docs => {
        this.documentosSubject.next(docs);
        this.loadingSubject.next(false);
      },
      error: () => this.loadingSubject.next(false),
    });
  }

  porPolitica(politicaId: string): Observable<Documento[]> {
    return this.http.get<Documento[]>(`${this.BASE}/por-politica/${politicaId}`);
  }

  porCliente(clienteId: string): Observable<Documento[]> {
    return this.http.get<Documento[]>(`${this.BASE}/por-cliente/${clienteId}`);
  }

  obtener(id: string): Observable<Documento> {
    return this.http.get<Documento>(`${this.BASE}/${id}`);
  }

  obtenerDetalle(id: string): Observable<DocumentoDetalle> {
    return this.http.get<DocumentoDetalle>(`${this.BASE}/${id}/detalle`);
  }

  // ── Upload ────────────────────────────────────────────────────────────────

  subir(
    archivo: File,
    opciones?: { politicaId?: string; tramiteId?: string; clienteId?: string },
  ): Observable<Documento> {
    const form = new FormData();
    form.append('file', archivo, archivo.name);
    if (opciones?.politicaId) form.append('politicaId', opciones.politicaId);
    if (opciones?.tramiteId)  form.append('tramiteId',  opciones.tramiteId);
    if (opciones?.clienteId)  form.append('clienteId',  opciones.clienteId);

    return this.http.post<Documento>(`${this.BASE}/upload`, form).pipe(
      tap(doc => {
        const actual = this.documentosSubject.getValue();
        this.documentosSubject.next([doc, ...actual]);
      }),
    );
  }

  // ── Descarga / Edición ─────────────────────────────────────────────────────

  obtenerUrlDescarga(id: string): Observable<DownloadUrlResponse> {
    return this.http.get<DownloadUrlResponse>(`${this.BASE}/${id}/download`);
  }

  obtenerConfigEdicion(id: string): Observable<EditUrlResponse> {
    return this.http.post<EditUrlResponse>(`${this.BASE}/${id}/edit-url`, {});
  }

  // ── Permisos ──────────────────────────────────────────────────────────────

  actualizarPermisos(id: string, body: UpdatePermisosRequest): Observable<Documento> {
    return this.http.put<Documento>(`${this.BASE}/${id}/permisos`, body).pipe(
      tap(doc => this._actualizarEnEstado(doc)),
    );
  }

  // ── Historial ─────────────────────────────────────────────────────────────

  obtenerHistorial(id: string): Observable<DocumentoEvent[]> {
    return this.http.get<DocumentoEvent[]>(`${this.BASE}/${id}/historial`);
  }

  // ── Versiones ─────────────────────────────────────────────────────────────

  subirNuevaVersion(id: string, archivo: File): Observable<Documento> {
    const form = new FormData();
    form.append('archivo', archivo, archivo.name);
    return this.http.post<Documento>(`${this.BASE}/${id}/nueva-version`, form);
  }

  obtenerVersiones(id: string): Observable<Documento[]> {
    return this.http.get<Documento[]>(`${this.BASE}/${id}/versiones`);
  }

  // ── Eliminar ──────────────────────────────────────────────────────────────

  eliminar(id: string): Observable<void> {
    return this.http.delete<void>(`${this.BASE}/${id}`).pipe(
      tap(() => {
        const actual = this.documentosSubject.getValue();
        this.documentosSubject.next(actual.filter(d => d.id !== id));
      }),
    );
  }

  // ── Estado local ─────────────────────────────────────────────────────────

  private _actualizarEnEstado(doc: Documento): void {
    const actual = this.documentosSubject.getValue();
    const idx = actual.findIndex(d => d.id === doc.id);
    if (idx >= 0) {
      const copia = [...actual];
      copia[idx] = doc;
      this.documentosSubject.next(copia);
    }
  }
}
