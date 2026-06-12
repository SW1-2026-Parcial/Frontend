export type NivelPermiso = 'READ' | 'WRITE' | 'DELETE' | 'ADMIN';

export type ExtensionDocumento =
  | 'pdf' | 'docx' | 'doc' | 'xlsx' | 'xls'
  | 'png' | 'jpg' | 'jpeg' | 'gif'
  | 'txt' | 'csv' | 'pptx' | 'ppt';

export type TipoEventoDocumento =
  | 'UPLOADED' | 'VIEWED' | 'EDITED'
  | 'DELETED' | 'DOWNLOADED' | 'PERMISSION_CHANGED';

export interface PermisoDocumento {
  userId: string;
  nivel: NivelPermiso;
}

export interface Documento {
  id: string;
  nombre: string;
  extension: string;
  tamano: number;           // bytes
  mimeType: string;
  politicaId: string | null;
  tramiteId: string | null;
  clienteId: string | null;
  subidoPorId: string;
  modificadoPorId: string | null;
  permisos: PermisoDocumento[];
  // Versionado
  version: number;
  versionAnteriorId: string | null;
  esVersionActual: boolean;
  creadoEn: string;
  actualizadoEn: string | null;
}

export interface DocumentoEvent {
  id: string;
  documentoId: string;
  tipo: TipoEventoDocumento;
  actorId: string;
  detalles: Record<string, unknown> | null;
  timestamp: string;
}

export interface DownloadUrlResponse {
  url: string;
  expiraEn: number;  // segundos
}

export interface EditUrlResponse {
  documentUrl: string;
  callbackUrl: string;
  documentKey: string;
  documentType: 'text' | 'spreadsheet' | 'presentation';
  nombre: string;
  token?: string;          // JWT firmado para OnlyOffice
  onlyofficeUrl?: string;  // URL del Document Server
  config?: Record<string, unknown>;  // Config completa para el JS SDK
}

export interface UpdatePermisosRequest {
  permisos: PermisoDocumento[];
}

export interface PermisoDetalle {
  userId: string;
  nombre: string;
  nivel: NivelPermiso;
}

export interface HistorialItem {
  tipo: TipoEventoDocumento;
  actorId: string;
  actorNombre: string;
  timestamp: string;
}

export interface DocumentoDetalle extends Documento {
  subidoPorNombre: string;
  modificadoPorNombre: string | null;
  permisosDetalle: PermisoDetalle[];
  historial: HistorialItem[];
}

// Utilidades

export const ICONOS_EXTENSION: Record<string, string> = {
  pdf:  'pi pi-file-pdf',
  docx: 'pi pi-file-word',
  doc:  'pi pi-file-word',
  xlsx: 'pi pi-file-excel',
  xls:  'pi pi-file-excel',
  pptx: 'pi pi-file',
  ppt:  'pi pi-file',
  png:  'pi pi-image',
  jpg:  'pi pi-image',
  jpeg: 'pi pi-image',
  gif:  'pi pi-image',
  txt:  'pi pi-file-edit',
  csv:  'pi pi-table',
};

export const COLORES_EXTENSION: Record<string, string> = {
  pdf:  '#e53935',
  docx: '#1565c0',
  doc:  '#1565c0',
  xlsx: '#2e7d32',
  xls:  '#2e7d32',
  png:  '#6a1b9a',
  jpg:  '#6a1b9a',
  jpeg: '#6a1b9a',
};

export function formatearTamano(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
