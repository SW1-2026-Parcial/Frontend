
export type EstadoTramite = 'ACTIVE' | 'COMPLETED' | 'REJECTED' | 'CANCELLED';
export type Prioridad     = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'URGENT';

export interface Tramite {
  id:               string;
  politicaId:       string;
  versionPoliticaId:string;
  status:           EstadoTramite;
  currentNodeIds:   string[];
  prioridad:        Prioridad;
  initiatedBy:      string;
  ticketNumber:     string;
  startedAt:        string;
  completedAt:      string | null;

  // Campo denormalizado — puede estar presente si el backend lo incluye
  politicaNombre?:  string;
}

export const PRIORIDAD_SEVERITIES: Record<Prioridad, string> = {
  LOW:      'secondary',
  MEDIUM:   'info',
  HIGH:     'warning',
  CRITICAL: 'danger',
  URGENT:   'danger',
};

export const PRIORIDAD_LABELS: Record<Prioridad, string> = {
  LOW:      'Baja',
  MEDIUM:   'Media',
  HIGH:     'Alta',
  CRITICAL: 'Crítica',
  URGENT:   'Urgente',
};

// ── Payloads WebSocket (STOMP) ──────────────────────────────────────────────────

/** Payload que llega por /topic/tramites/{tramiteId} en cualquier evento del trámite. */
export interface TramiteWsPayload {
  tramiteId:      string;
  status:         EstadoTramite;
  currentNodeIds: string[];
  updatedAt:      string;
}

/** Payload que llega por /topic/tareas/{userId} cuando una tarea es delegada. */
export interface TareaWsPayload {
  taskId:        string;
  nodoEtiqueta:  string;
  tramiteTicket: string;
}

// ── Requests / Responses REST ───────────────────────────────────────────────────

export interface IniciarTramiteRequest {
  politicaId: string;
  prioridad:  Prioridad;
}

export interface IniciarTramiteResponse {
  id:               string;
  politicaId:       string;
  versionPoliticaId:string;
  status:           EstadoTramite;
  currentNodeIds:   string[];
  prioridad:        Prioridad;
  initiatedBy:      string;
  ticketNumber:     string;
  startedAt:        string;
  completedAt:      string | null;
}
