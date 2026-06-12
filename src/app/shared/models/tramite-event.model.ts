export type TipoEvento =
  | 'STARTED' | 'NODE_ENTERED' | 'TASK_COMPLETED'
  | 'TASK_REJECTED' | 'DECISION_TAKEN' | 'FORK_SPLIT'
  | 'JOIN_SYNCHRONIZED' | 'MERGE_PASSED' | 'COMPLETED' | 'CANCELLED';

export interface TramiteEvent {
  id:             string;
  tramiteId:      string;
  tipo:           TipoEvento;
  nodeId:         string | null;
  calleId:        string | null;
  departamentoId: string | null;
  actorId:        string | null;
  taskId:         string | null;
  formData:       Record<string, unknown> | null;
  branchTaken:    boolean | null;
  comentario:     string | null;
  timestamp:      string; // ISO8601
}

export const EVENTO_LABELS: Record<TipoEvento, string> = {
  STARTED:           'Trámite iniciado',
  NODE_ENTERED:      'Nodo activado',
  TASK_COMPLETED:    'Tarea completada',
  TASK_REJECTED:     'Tarea rechazada',
  DECISION_TAKEN:    'Decisión tomada',
  FORK_SPLIT:        'Flujo paralelo lanzado',
  JOIN_SYNCHRONIZED: 'Flujos sincronizados',
  MERGE_PASSED:      'Convergencia pasada',
  COMPLETED:         'Trámite completado',
  CANCELLED:         'Trámite cancelado',
};

export const EVENTO_ICON: Record<TipoEvento, string> = {
  STARTED:           'pi pi-play-circle',
  NODE_ENTERED:      'pi pi-arrow-right',
  TASK_COMPLETED:    'pi pi-check-circle',
  TASK_REJECTED:     'pi pi-times-circle',
  DECISION_TAKEN:    'pi pi-directions',
  FORK_SPLIT:        'pi pi-share-alt',
  JOIN_SYNCHRONIZED: 'pi pi-link',
  MERGE_PASSED:      'pi pi-sort-alt',
  COMPLETED:         'pi pi-check',
  CANCELLED:         'pi pi-ban',
};

export const EVENTO_SEVERITY: Record<TipoEvento, string> = {
  STARTED:           'info',
  NODE_ENTERED:      'secondary',
  TASK_COMPLETED:    'success',
  TASK_REJECTED:     'danger',
  DECISION_TAKEN:    'info',
  FORK_SPLIT:        'info',
  JOIN_SYNCHRONIZED: 'success',
  MERGE_PASSED:      'secondary',
  COMPLETED:         'success',
  CANCELLED:         'danger',
};
