
import { CampoDefinicion } from './politica.model';
import { Prioridad } from './tramite.model';

export type EstadoTarea = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED';

/** Tarea tal como la devuelve GET /api/tasks/my-tasks */
export interface Tarea {
  id:            string;
  tramiteId:     string;
  nodeId:        string;
  calleId:       string;
  departamentoId:string;
  assignedTo:    string | null;
  status:        EstadoTarea;
  formData:      Record<string, unknown> | null;
  branchSelected:boolean | null;
  createdAt:     string;
  updatedAt:     string;
  completedAt:   string | null;

  // Campos denormalizados — presentes en GET /tasks/:id, opcionales en la lista
  tramiteTicket?:       string;
  politicaNombre?:      string;
  nodoNombre?:          string;
  departamentoNombre?:  string;
  prioridad?:           Prioridad;
}

/** Detalle extendido devuelto por GET /tasks/:id — incluye datos del nodo. */
export interface TareaDetalle extends Tarea {
  nodoFormulario:     CampoDefinicion[];
  instruccionAvance:  string | null;
  instruccionRechazo: string | null;
  nodoTieneDecision:  boolean;
}

export interface CompletarTareaRequest {
  formData:        Record<string, unknown>;
  branchSelected?: boolean;
}

export interface RechazarTareaRequest {
  motivo: string;
}

export interface ArchivoInfo {
  clave:         string;
  nombreArchivo: string;
  downloadUrl:   string;
}

export interface TaskDetailResponse {
  taskId:          string;
  nodoId:          string;
  etiqueta:        string;
  calleNombre:     string | null;
  departamentoId:  string | null;
  completadoPor:   { userId: string; nombre: string } | null;
  completadoEn:    string | null;
  formData:        Record<string, unknown>;
  camposDefinicion: CampoDefinicion[];
  archivos:        ArchivoInfo[];
}
