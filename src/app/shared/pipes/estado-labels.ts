/**
 * Mapa centralizado de todos los estados/enums del sistema → etiquetas en español.
 * Fuente única de verdad — usado por EstadoPipe y Sp1BadgeComponent.
 */
export const ESTADO_LABELS: Record<string, string> = {
  // Trámite / Tarea
  PENDING:       'Pendiente',
  IN_PROGRESS:   'En Proceso',
  COMPLETED:     'Completado',
  REJECTED:      'Rechazado',
  ACTIVE:        'Activo',
  CANCELLED:     'Cancelado',
  // Política
  DRAFT:         'Borrador',
  PUBLISHED:     'Publicada',
  ARCHIVED:      'Archivada',
  // Rol
  ADMINISTRADOR: 'Administrador',
  SUPERVISOR:    'Supervisor',
  FUNCIONARIO:   'Funcionario',
  // Prioridad
  LOW:           'Baja',
  MEDIUM:        'Media',
  HIGH:          'Alta',
  URGENT:        'Urgente',
  CRITICAL:      'Critica',
  // Boolean
  ACTIVO:        'Activo',
  INACTIVO:      'Inactivo',
};
