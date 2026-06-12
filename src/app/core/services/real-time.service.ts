/**
 * Facade tipado sobre WebsocketService.
 * Componentes usan canales tipados, no topic strings.
 */
import { Injectable } from '@angular/core';
import { Observable }  from 'rxjs';
import { WebsocketService }    from './websocket.service';
import { CanvasWsEnvelope }    from '../../shared/models/politica.model';
import { TramiteWsPayload, TareaWsPayload } from '../../shared/models/tramite.model';

const TOPIC = {
  canvas:     (id: string) => `/topic/canvas/${id}`,
  tramite:    (id: string) => `/topic/tramites/${id}`,
  tareas:     (id: string) => `/topic/tareas/${id}`,
  canvasJoin: (id: string) => `/app/canvas/${id}/join`,
} as const;

export type RtChannel =
  | { type: 'canvas';  versionId: string }
  | { type: 'tramite'; tramiteId: string }
  | { type: 'tareas';  departamentoId: string };

@Injectable({ providedIn: 'root' })
export class RealTimeService {
  constructor(private ws: WebsocketService) {}

  connect(): void { this.ws.connect(); }
  disconnect(): void { this.ws.disconnect(); }

  canvas$(versionId: string): Observable<CanvasWsEnvelope> {
    return this.ws.subscribe<CanvasWsEnvelope>(TOPIC.canvas(versionId));
  }

  tramite$(tramiteId: string): Observable<TramiteWsPayload> {
    return this.ws.subscribe<TramiteWsPayload>(TOPIC.tramite(tramiteId));
  }

  tareas$(departamentoId: string): Observable<TareaWsPayload> {
    return this.ws.subscribe<TareaWsPayload>(TOPIC.tareas(departamentoId));
  }

  joinCanvas(versionId: string, usuario: { email: string; nombre: string }): void {
    this.ws.publish(TOPIC.canvasJoin(versionId), usuario);
  }

  publishCanvasEvent(versionId: string, envelope: CanvasWsEnvelope): void {
    this.ws.publish(TOPIC.canvas(versionId), envelope);
  }
}
