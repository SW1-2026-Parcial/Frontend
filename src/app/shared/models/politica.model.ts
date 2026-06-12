
// ── Enums ────────────────────────────────────────────────────────────────────

export type EstadoPolitica = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

/** 7 tipos de nodo según UML 2.5.1 (ADR-014). */
export type TipoNodo =
  | 'START'     // InitialNode — ●
  | 'END'       // ActivityFinalNode — ⊙
  | 'ACTIVITY'  // OpaqueAction — rectángulo redondeado
  | 'DECISION'  // DecisionNode — diamante (exactamente 2 salidas)
  | 'MERGE'     // MergeNode — diamante convergente (primer flujo pasa)
  | 'FORK'      // ForkNode — barra horizontal (genera paralelos)
  | 'JOIN';     // JoinNode — barra horizontal (sincroniza paralelos)

/** Tipos de campo del formulario dinámico de un nodo ACTIVITY. */
export type TipoCampo = 'TEXT' | 'NUMBER' | 'DATE' | 'SELECT' | 'FILE' | 'TEXTAREA' | 'BUTTON';

// ── Entidades principales ─────────────────────────────────────────────────────

export interface Politica {
  id: string;
  nombre: string;
  descripcion: string | null;
  estado: EstadoPolitica;
  versionActual: number;   // 0 = sin versión publicada aún
  creadoPorId: string;
  creadoEn: string;
  actualizadoEn: string;
}

export interface VersionPolitica {
  id: string;              // ObjectId MongoDB — usar como versionId en canvas
  politicaId: string;
  numeroVersion: number;
  estado: 'DRAFT' | 'PUBLISHED';
  validado: boolean;       // true = habilitado para publicar
  publicadoPorId?: string | null;
  publicadoEn: string | null;
  creadoEn: string;
}

// ── Calle (Swim Lane / ActivityPartition UML) ─────────────────────────────────

/**
 * Calle de un diagrama de actividades UML.
 * Embebida en VersionPolitica en el backend.
 * Agrupa nodos ACTIVITY de un mismo departamento.
 */
export interface Calle {
  calleId: string;                         // UUID lógico
  nombre: string;
  departamentoId: string | null;
  departamentoNombre?: string | null;      // desnormalizado (no siempre presente)
  posicionCanvas: { x: number; y: number };
  dimensiones: { ancho: number; alto: number };
  orden: number;
}

// ── Nodo ─────────────────────────────────────────────────────────────────────

/** Conexión saliente desde un nodo. */
export interface SalidaNodo {
  nodoDestino: string;       // nodoId UUID del nodo destino
  rama: boolean;             // false = principal/éxito | true = alternativa/rechazo
  etiqueta?: string | null;
}

/** Definición de un campo en el formulario dinámico del nodo ACTIVITY. */
export interface CampoDefinicion {
  nombre: string;            // snake_case — clave del valor en el formulario ejecutado
  etiqueta: string;          // label visible para el Funcionario
  tipo: TipoCampo;
  requerido: boolean;
  opciones?: string[];       // solo para tipo SELECT
  accionClave?: string;      // solo para tipo BUTTON — clave en formData del valor de confirmación
}

/** Nodo del diagrama — GET/POST /api/versions/{versionId}/nodes. */
export interface NodoUML {
  id: string;                // ObjectId MongoDB
  versionPoliticaId: string;
  nodoId: string;            // UUID lógico — usar en conexiones y URLs, NO el id
  calleId: string | null;    // null para nodos de control (START, END, DECISION, MERGE, FORK, JOIN)
  tipoNodo: TipoNodo;
  etiqueta: string;
  posicionCanvas: { x: number; y: number };
  salidas: SalidaNodo[];
  formulario: CampoDefinicion[];      // solo para ACTIVITY
  instruccionAvance: string | null;   // texto guía — no se evalúa automáticamente
  instruccionRechazo: string | null;  // texto guía — no se evalúa automáticamente
  creadoEn: string;
}

// ── Diagrama completo ─────────────────────────────────────────────────────────

/** Respuesta de GET /api/policies/{id}/versions/{versionId}. */
export interface DiagramaCompleto {
  version: VersionPolitica;
  calles: Calle[];
  nodos: NodoUML[];
}

// ── Validación ────────────────────────────────────────────────────────────────

export interface ResultadoValidacion {
  valido: boolean;
  errores: ItemValidacion[];
  warnings?: ItemValidacion[];
}

export interface ItemValidacion {
  tipo: string;
  mensaje: string;
  nodoId: string | null;
}

// ── Labels y utilidades de UI ─────────────────────────────────────────────────

export const ESTADO_POLITICA_LABELS: Record<EstadoPolitica, string> = {
  DRAFT:     'Borrador',
  PUBLISHED: 'Publicada',
  ARCHIVED:  'Archivada',
};

export const TIPO_NODO_LABELS: Record<TipoNodo, string> = {
  START:    'Inicio',
  END:      'Fin',
  ACTIVITY: 'Actividad',
  DECISION: 'Decisión',
  MERGE:    'Convergencia',
  FORK:     'Paralelismo',
  JOIN:     'Sincronización',
};

/** Colores de las calles (se ciclan si hay más de 6). */
export const LANE_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b',
  '#ef4444', '#8b5cf6', '#ec4899',
];

// ── Canvas WebSocket — colaboración en tiempo real ────────────────────────────

export interface AdminPresenciaInfo {
  email:  string;
  nombre: string;
  color:  string;
}

export type CanvasEventTipo =
  | 'NODO_CREADO'     | 'NODO_ACTUALIZADO'  | 'NODO_CONFIGURADO' | 'NODO_ELIMINADO'
  | 'CONEXION_CREADA' | 'CONEXION_ELIMINADA'
  | 'CALLE_CREADA'    | 'CALLE_ACTUALIZADA' | 'CALLE_ELIMINADA'
  | 'ADMIN_JOINED'    | 'ADMIN_LEFT'
  | 'DIAGRAMA_GENERADO_IA' | 'POLITICA_PUBLICADA';

export interface CanvasWsEnvelope {
  tipo:       CanvasEventTipo;
  versionId:  string;
  adminEmail: string;
  payload:    unknown;
  timestamp:  string;
}

/** Dimensiones visuales de cada tipo de nodo en el canvas SVG. */
export const NODO_DIM: Record<TipoNodo, { w: number; h: number }> = {
  START:    { w: 36,  h: 36  },
  END:      { w: 36,  h: 36  },
  ACTIVITY: { w: 160, h: 56  },
  DECISION: { w: 64,  h: 64  },
  MERGE:    { w: 64,  h: 64  },
  FORK:     { w: 12,  h: 120 },
  JOIN:     { w: 12,  h: 120 },
};
