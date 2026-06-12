
export interface Departamento {
  id: string;
  nombre: string;
  descripcion: string | null;
  responsableId?: string | null;
  activo: boolean;
  creadoEn?: string;
  actualizadoEn?: string;
}

export interface CrearDepartamentoRequest {
  nombre: string;
  descripcion: string | null;
}

export interface ActualizarDepartamentoRequest {
  nombre?: string | null;
  descripcion?: string | null;
}
