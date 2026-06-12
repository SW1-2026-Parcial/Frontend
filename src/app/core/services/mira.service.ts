import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface MiraDashboard {
  resumenRiesgos: { BAJO: number; MEDIO: number; ALTO: number; CRITICO: number };
  totalAnomalias: number;
  totalTareasPendientes: number;
  bottleneckTopNodo: string | null;
  scoreRiesgoGlobal: number;
  alertas: MiraAlerta[];
}

export interface MiraAlerta {
  tramiteId: string;
  ticketNumber: string | null;
  tipo: string;
  descripcion: string;
  gravedad: 'INFO' | 'WARNING' | 'ERROR';
  nodeId: string | null;
  timestamp: string;
}

export interface RiesgoItem {
  tramiteId: string;
  ticketNumber: string | null;
  probabilidadDemora: number;
  nivelRiesgo: string;
  factores: string[];
  horasTranscurridas: number;
  horasEstimadasRestantes: number;
}

export interface RiesgoResponse {
  tramites: RiesgoItem[];
  resumen: Record<string, number>;
}

export interface AnomaliaResponse {
  anomalias: MiraAlerta[];
  total: number;
}

export interface TareaPriorizada {
  taskId: string;
  tramiteId: string;
  ticketNumber: string | null;
  nodeId: string;
  etiquetaNodo: string;
  scoreUrgencia: number;
  factores: string[];
  assignedTo: string | null;
  departamentoId: string | null;
  prioridadMIRA: number;
}

export interface PriorizacionResponse {
  tareas: TareaPriorizada[];
  total: number;
}

@Injectable({ providedIn: 'root' })
export class MiraService {
  private readonly BASE = `${environment.apiUrl}/mira`;

  constructor(private http: HttpClient) {}

  getDashboard(): Observable<MiraDashboard> {
    return this.http.get<MiraDashboard>(`${this.BASE}/dashboard`);
  }

  getRiesgos(): Observable<RiesgoResponse> {
    return this.http.get<RiesgoResponse>(`${this.BASE}/risk-analysis`);
  }

  getAnomalias(): Observable<AnomaliaResponse> {
    return this.http.get<AnomaliaResponse>(`${this.BASE}/anomalies`);
  }

  getPriorizacion(): Observable<PriorizacionResponse> {
    return this.http.get<PriorizacionResponse>(`${this.BASE}/resource-priority`);
  }

  getPredictRoute(tramiteId: string): Observable<Record<string, unknown>> {
    return this.http.get<Record<string, unknown>>(`${this.BASE}/predict-route/${tramiteId}`);
  }
}
