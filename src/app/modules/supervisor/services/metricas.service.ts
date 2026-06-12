/*
 * MÓDULO: Supervisor
 * DESCRIPCIÓN: Servicio de métricas y cuellos de botella
 */

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { BottleneckResponse, PerformanceResponse } from '../../../shared/models/metrics.model';
import { environment } from '../../../../environments/environment';

/**
 * Scoped a SupervisorModule.providers — NO usar fuera del módulo Supervisor.
 * MonitorService sí es providedIn:root porque se usa también en MotorModule.
 */
@Injectable()
export class MetricasService {

  private readonly BASE = `${environment.apiUrl}`;

  constructor(private http: HttpClient) {}

  /** GET /api/metrics/bottlenecks?versionId={id} */
  obtenerCuellos(versionId: string): Observable<BottleneckResponse[]> {
    return this.http.get<BottleneckResponse[]>(`${this.BASE}/metrics/bottlenecks`, {
      params: { versionId },
    });
  }

  /** GET /api/metrics/performance?versionId={id}&desde={ISO}&hasta={ISO} */
  obtenerPerformance(
    versionId: string,
    desde?: string,
    hasta?: string,
  ): Observable<PerformanceResponse> {
    let params = new HttpParams().set('versionId', versionId);
    if (desde) params = params.set('desde', desde);
    if (hasta) params = params.set('hasta', hasta);

    return this.http.get<PerformanceResponse>(`${this.BASE}/metrics/performance`, { params });
  }
}
