import { Component, Input, OnInit } from '@angular/core';
import { MessageService } from 'primeng/api';
import { HttpClient } from '@angular/common/http';

import { DocumentoService } from '../../services/documento.service';
import {
  Documento,
  PermisoDocumento,
  NivelPermiso,
} from '../../../../shared/models/documento.model';
import { environment } from '../../../../../environments/environment';

interface UsuarioBasico {
  id: string;
  nombre: string;
  email: string;
}

@Component({
  selector: 'app-permisos-panel',
  standalone: false,
  templateUrl: './permisos-panel.component.html',
  styleUrls: ['./permisos-panel.component.scss'],
  providers: [MessageService],
})
export class PermisosPanelComponent implements OnInit {
  @Input() documento!: Documento;

  usuarios: UsuarioBasico[] = [];
  permisos: PermisoDocumento[] = [];
  niveles: { label: string; value: NivelPermiso }[] = [
    { label: 'Lectura', value: 'READ' },
    { label: 'Escritura', value: 'WRITE' },
    { label: 'Eliminar', value: 'DELETE' },
    { label: 'Admin', value: 'ADMIN' },
  ];
  saving = false;

  constructor(
    private http: HttpClient,
    private docService: DocumentoService,
    private messageService: MessageService,
  ) {}

  ngOnInit(): void {
    this.permisos = [...this.documento.permisos];
    this.cargarUsuarios();
  }

  cargarUsuarios(): void {
    this.http.get<UsuarioBasico[]>(`${environment.apiUrl}/users`).subscribe(users => {
      this.usuarios = users;
    });
  }

  agregarPermiso(): void {
    this.permisos.push({ userId: '', nivel: 'READ' });
  }

  quitarPermiso(idx: number): void {
    this.permisos.splice(idx, 1);
  }

  guardar(): void {
    const validos = this.permisos.filter(p => p.userId);
    this.saving = true;
    this.docService.actualizarPermisos(this.documento.id, { permisos: validos }).subscribe({
      next: () => {
        this.saving = false;
        this.messageService.add({ severity: 'success', summary: 'Permisos actualizados' });
      },
      error: () => {
        this.saving = false;
        this.messageService.add({ severity: 'error', summary: 'Error al guardar permisos' });
      },
    });
  }

  getNombreUsuario(userId: string): string {
    return this.usuarios.find(u => u.id === userId)?.nombre || userId;
  }
}
