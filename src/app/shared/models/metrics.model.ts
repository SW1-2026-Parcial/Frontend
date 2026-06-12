/** Cuello de botella: nodo con mayor tiempo promedio de ejecución. */
export interface BottleneckResponse {
  nodeId:        string;
  etiqueta:      string;      // nombre del nodo (resuelto por el backend)
  avgDurationMs: number;      // tiempo promedio en milisegundos
  count:         number;      // total de ejecuciones registradas
  ranking:       number;      // 1 = más lento
}

/** Métricas de rendimiento general del sistema (o de una versión de política). */
export interface PerformanceResponse {
  total:           number;        // total de trámites
  active:          number;        // activos
  completed:       number;        // completados
  rejected:        number;        // rechazados
  cancelled:       number;        // cancelados
  completionRate:  number;        // porcentaje de completación (0–100)
  avgCompletionMs: number | null; // tiempo promedio de completación en ms (null si no hay datos)
}
