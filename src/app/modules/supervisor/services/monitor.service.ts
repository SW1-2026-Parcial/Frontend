/*
 * MÓDULO: Supervisor
 * DESCRIPCIÓN: Servicio de monitoreo de trámites — carga y estado reactivo
 */

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';

import { Tramite, EstadoTramite } from '../../../shared/models/tramite.model';
import { TramiteEvent } from '../../../shared/models/tramite-event.model';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class MonitorService {

  private readonly BASE = `${environment.apiUrl}`;

  private tramitesSubject = new BehaviorSubject<Tramite[]>([]);
  private loadingSubject  = new BehaviorSubject<boolean>(false);

  tramites$ = this.tramitesSubject.asObservable();
  loading$  = this.loadingSubject.asObservable();

  constructor(private http: HttpClient) {}

  /** GET /api/tramites?status=...&politicaId=... */
  cargarTramites(filtros?: { status?: EstadoTramite; politicaId?: string }): void {
    this.loadingSubject.next(true);
    let params = new HttpParams();
    if (filtros?.status)     params = params.set('status',     filtros.status);
    if (filtros?.politicaId) params = params.set('politicaId', filtros.politicaId);

    this.http.get<Tramite[]>(`${this.BASE}/tramites`, { params }).subscribe({
      next: tramites => {
        this.tramitesSubject.next(tramites);
        this.loadingSubject.next(false);
      },
      error: () => this.loadingSubject.next(false),
    });
  }

  /** GET /api/tramites/{id}/history */
  obtenerHistorial(tramiteId: string): Observable<TramiteEvent[]> {
    return this.http.get<TramiteEvent[]>(`${this.BASE}/tramites/${tramiteId}/history`);
  }

  /** GET /api/tramites/{id} */
  obtenerTramite(id: string): Observable<Tramite> {
    return this.http.get<Tramite>(`${this.BASE}/tramites/${id}`);
  }
}
