import { Component, Input, OnInit, OnChanges, SimpleChanges, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MessageService } from 'primeng/api';

import { DocumentoService } from '../../services/documento.service';
import {
  Documento,
  DocumentoDetalle,
  PermisoDetalle,
  HistorialItem,
  NivelPermiso,
  formatearTamano,
  ICONOS_EXTENSION,
  COLORES_EXTENSION,
} from '../../../../shared/models/documento.model';
import { environment } from '../../../../../environments/environment';

interface UsuarioBasico {
  id: string;
  nombre: string;
  email: string;
}

@Component({
  selector: 'app-documento-detalle',
  standalone: false,
  templateUrl: './documento-detalle.component.html',
  styleUrls: ['./documento-detalle.component.scss'],
  providers: [MessageService],
})
export class DocumentoDetalleComponent implements OnInit, OnChanges {
  @Input() documentoId = '';
  @Output() permisosActualizados = new EventEmitter<void>();

  detalle: DocumentoDetalle | null = null;
  loading = true;
  activeTab = 'info';

  // Permisos
  usuarios: UsuarioBasico[] = [];
  permisosEditables: { userId: string; nivel: NivelPermiso }[] = [];
  niveles: { label: string; value: NivelPermiso }[] = [
    { label: 'Lectura', value: 'READ' },
    { label: 'Escritura', value: 'WRITE' },
    { label: 'Eliminar', value: 'DELETE' },
    { label: 'Admin', value: 'ADMIN' },
  ];
  savingPermisos = false;

  // Versiones
  versiones: Documento[] = [];
  loadingVersiones = false;
  subiendoVersion = false;
  archivoNuevaVersion: File | null = null;

  formatearTamano = formatearTamano;

  constructor(
    private docService: DocumentoService,
    private http: HttpClient,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['documentoId'] && !changes['documentoId'].firstChange) {
      this.cargar();
    }
  }

  cargar(): void {
    if (!this.documentoId) return;
    this.loading = true;
    this.docService.obtenerDetalle(this.documentoId).subscribe({
      next: det => {
        this.detalle = det;
        this.permisosEditables = det.permisosDetalle.map(p => ({
          userId: p.userId,
          nivel: p.nivel,
        }));
        this.loading = false;
        this.cdr.detectChanges();
        this.cargarUsuarios();
      },
      error: () => {
        this.loading = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el detalle' });
      },
    });
  }

  cargarUsuarios(): void {
    this.http.get<UsuarioBasico[]>(`${environment.apiUrl}/users`).subscribe(users => {
      this.usuarios = users;
      this.cdr.detectChanges();
    });
  }

  getIcono(ext: string): string {
    return ICONOS_EXTENSION[ext] || 'pi pi-file';
  }

  getColor(ext: string): string {
    return COLORES_EXTENSION[ext] || '#616161';
  }

  getEventLabel(tipo: string): string {
    switch (tipo) {
      case 'UPLOADED': return 'Subido';
      case 'EDITED': return 'Modificado';
      default: return tipo;
    }
  }

  getEventIcon(tipo: string): string {
    switch (tipo) {
      case 'UPLOADED': return 'pi pi-upload';
      case 'EDITED': return 'pi pi-pencil';
      default: return 'pi pi-circle';
    }
  }

  getEventColor(tipo: string): string {
    switch (tipo) {
      case 'UPLOADED': return '#22c55e';
      case 'EDITED': return '#3b82f6';
      default: return '#94a3b8';
    }
  }

  getNivelLabel(nivel: string): string {
    switch (nivel) {
      case 'READ': return 'Lectura';
      case 'WRITE': return 'Escritura';
      case 'DELETE': return 'Eliminar';
      case 'ADMIN': return 'Admin';
      default: return nivel;
    }
  }

  getNivelSeverity(nivel: string): string {
    switch (nivel) {
      case 'READ': return 'info';
      case 'WRITE': return 'success';
      case 'DELETE': return 'warn';
      case 'ADMIN': return 'danger';
      default: return 'secondary';
    }
  }

  // ── Permisos ──────────────────────────────────────────────────────────────

  agregarPermiso(): void {
    this.permisosEditables.push({ userId: '', nivel: 'READ' });
  }

  quitarPermiso(idx: number): void {
    this.permisosEditables.splice(idx, 1);
  }

  guardarPermisos(): void {
    const validos = this.permisosEditables.filter(p => p.userId);
    this.savingPermisos = true;
    this.docService.actualizarPermisos(this.documentoId, { permisos: validos }).subscribe({
      next: () => {
        this.savingPermisos = false;
        this.messageService.add({ severity: 'success', summary: 'Permisos actualizados' });
        this.cargar();
        this.permisosActualizados.emit();
      },
      error: () => {
        this.savingPermisos = false;
        this.messageService.add({ severity: 'error', summary: 'Error al guardar permisos' });
      },
    });
  }

  getNombreUsuario(userId: string): string {
    return this.usuarios.find(u => u.id === userId)?.nombre || userId;
  }

  // Filter out users already in permisos list for dropdown
  getUsuariosDisponibles(currentUserId: string): UsuarioBasico[] {
    const usados = new Set(this.permisosEditables.map(p => p.userId).filter(id => id !== currentUserId));
    return this.usuarios.filter(u => !usados.has(u.id));
  }

  // ── Versiones ──────────────────────────────────────────────────────────────

  cargarVersiones(): void {
    if (!this.documentoId) return;
    this.loadingVersiones = true;
    this.docService.obtenerVersiones(this.documentoId).subscribe({
      next: vers => {
        this.versiones = vers;
        this.loadingVersiones = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadingVersiones = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el historial de versiones' });
      },
    });
  }

  onTabChange(value: string): void {
    if (value === 'versiones' && this.versiones.length === 0) {
      this.cargarVersiones();
    }
  }

  onArchivoSeleccionado(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.archivoNuevaVersion = input.files?.[0] ?? null;
  }

  subirNuevaVersion(): void {
    if (!this.archivoNuevaVersion || !this.documentoId) return;
    this.subiendoVersion = true;
    this.docService.subirNuevaVersion(this.documentoId, this.archivoNuevaVersion).subscribe({
      next: nuevoDoc => {
        this.subiendoVersion = false;
        this.archivoNuevaVersion = null;
        this.messageService.add({ severity: 'success', summary: `Versión ${nuevoDoc.version} subida correctamente` });
        // recargar detalle y versiones
        this.cargar();
        this.cargarVersiones();
      },
      error: () => {
        this.subiendoVersion = false;
        this.messageService.add({ severity: 'error', summary: 'Error al subir nueva versión' });
      },
    });
  }
}
