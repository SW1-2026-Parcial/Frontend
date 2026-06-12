

/** Roles disponibles en el sistema sp1. */
export type Rol = 'ADMINISTRADOR' | 'SUPERVISOR' | 'FUNCIONARIO';

/**
 * Representa un usuario del sistema sp1.
 * Replica el UserResponse del backend — sin apellido, con creadoPor.
 */
export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: Rol;
  departamentoId: string | null;
  departamentoNombre?: string | null;
  activo: boolean;
  creadoPor?: string;
  creadoEn?: string;
  actualizadoEn?: string;
}

/** Payload para crear un usuario nuevo. */
export interface CrearUsuarioRequest {
  nombre: string;
  email: string;
  password: string;        // mínimo 8 caracteres
  rol: Rol;
  departamentoId: string | null;
}

/** Payload para actualizar datos de un usuario — campos null = no cambiar. */
export interface ActualizarUsuarioRequest {
  nombre?: string | null;
  departamentoId?: string | null;
  activo?: boolean | null;
}

/** Etiquetas legibles por rol — usadas en badges y selects. */
export const ROL_LABELS: Record<Rol, string> = {
  ADMINISTRADOR: 'Administrador',
  SUPERVISOR:    'Supervisor',
  FUNCIONARIO:   'Funcionario',
};

/** Colores de badge por rol — mapeados a variables SCSS. */
export const ROL_SEVERITIES: Record<Rol, string> = {
  ADMINISTRADOR: 'danger',
  SUPERVISOR:    'warning',
  FUNCIONARIO:   'info',
};
