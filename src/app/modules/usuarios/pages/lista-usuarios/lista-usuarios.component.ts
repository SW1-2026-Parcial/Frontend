/*
 * MÓDULO: M4 Usuarios
 * CASO DE USO: CU-01 — Gestión de Usuarios y Departamentos
 * ACTOR: Administrador
 * DESCRIPCIÓN: Página principal de gestión — tabla de usuarios con tabs para departamentos
 */

import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject, combineLatest, takeUntil, map, Observable } from 'rxjs';
import { MessageService, ConfirmationService } from 'primeng/api';

import { UsuarioService }      from '../../services/usuario.service';
import { DepartamentoService } from '../../services/departamento.service';
import { Usuario }             from '../../../../shared/models/usuario.model';
import { Departamento }        from '../../../../shared/models/departamento.model';
import { TableColumn }         from '../../../../shared/components/sp1-table/sp1-table.component';
import {
  CrearUsuarioRequest,
  ActualizarUsuarioRequest,
  Rol,
} from '../../../../shared/models/usuario.model';
import {
  CrearDepartamentoRequest,
  ActualizarDepartamentoRequest,
} from '../../../../shared/models/departamento.model';

/**
 * Smart Component — orquesta la gestión de usuarios y departamentos.
 * Tabs: "Usuarios" | "Departamentos"
 *
 * Módulo PUDS: M4 · Caso de uso: CU-01
 */
@Component({
  selector: 'app-lista-usuarios',
  standalone: false,
  templateUrl: './lista-usuarios.component.html',
  styleUrls: ['./lista-usuarios.component.scss'],
  providers: [MessageService, ConfirmationService],
})
export class ListaUsuariosComponent implements OnInit, OnDestroy {
  // --- Streams reactivos del servicio ---
  usuariosConDepto$!: Observable<Usuario[]>;
  loadingUsers$!: UsuarioService['loading$'];
  total$!:        UsuarioService['total$'];

  departamentos$!:  DepartamentoService['departamentos$'];
  loadingDeptos$!:  DepartamentoService['loading$'];

  // --- Estado de dialogs ---
  mostrarDialogUsuario     = false;
  mostrarDialogDepartamento = false;
  usuarioSeleccionado: Usuario | null = null;
  deptoSeleccionado: Departamento | null = null;
  modoEdicion = false;
  loadingGuardar = false;

  // --- Tab activo ---
  tabActivo: any = '0';

  // --- Filtro de búsqueda ---
  filtroTexto = '';

  // Columnas de la tabla de usuarios
  columnasUsuarios: TableColumn[] = [
    { key: 'nombre',             header: 'Nombre',        type: 'text',    sortable: true },
    { key: 'email',              header: 'Email',         type: 'text',    sortable: true },
    { key: 'rol',                header: 'Rol',           type: 'badge' },
    { key: 'departamentoNombre', header: 'Departamento',  type: 'text',    sortable: true },
    { key: 'activo',             header: 'Estado',        type: 'boolean' },
    { key: 'creadoEn',           header: 'Creado',        type: 'date',    sortable: true },
    { key: 'acciones',           header: 'Acciones',      type: 'actions', width: '120px' },
  ];

  // Columnas de la tabla de departamentos
  columnasDepartamentos: TableColumn[] = [
    { key: 'nombre',       header: 'Nombre',      type: 'text',    sortable: true },
    { key: 'descripcion',  header: 'Descripción', type: 'text' },
    { key: 'activo',       header: 'Estado',      type: 'boolean' },
    { key: 'creadoEn',     header: 'Creado',      type: 'date',    sortable: true },
    { key: 'acciones',     header: 'Acciones',    type: 'actions', width: '120px' },
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private usuarioService:     UsuarioService,
    private departamentoService: DepartamentoService,
    private messageService:     MessageService,
    private confirmationService: ConfirmationService,
  ) {
    this.loadingUsers$ = usuarioService.loading$;
    this.total$        = usuarioService.total$;
    this.departamentos$  = departamentoService.departamentos$;
    this.loadingDeptos$  = departamentoService.loading$;

    this.usuariosConDepto$ = combineLatest([
      usuarioService.usuarios$,
      departamentoService.departamentos$,
    ]).pipe(
      map(([usuarios, deptos]) =>
        usuarios.map(u => ({
          ...u,
          departamentoNombre: deptos.find(d => d.id === u.departamentoId)?.nombre ?? null,
        }))
      )
    );
  }

  ngOnInit(): void {
    this.usuarioService.cargarUsuarios();
    this.departamentoService.cargarDepartamentos();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ---- Acciones de Usuarios ----

  /** Abre el dialog para crear un nuevo usuario. */
  nuevoUsuario(): void {
    this.usuarioSeleccionado = null;
    this.modoEdicion = false;
    this.mostrarDialogUsuario = true;
  }

  /**
   * Abre el dialog para editar un usuario existente.
   * @param usuario - Usuario a editar
   */
  editarUsuario(usuario: Usuario): void {
    this.usuarioSeleccionado = { ...usuario };
    this.modoEdicion = true;
    this.mostrarDialogUsuario = true;
  }

  /**
   * Maneja el clic en una fila de la tabla.
   * @param row - Usuario de la fila clicada
   */
  onRowClick(row: unknown): void {
    this.editarUsuario(row as Usuario);
  }

  /**
   * Maneja los botones de acción de la tabla de usuarios.
   * @param event - { action: string; row: Usuario }
   */
  onAccionUsuario(event: { action: string; row: unknown }): void {
    const usuario = event.row as Usuario;
    if (event.action === 'edit') {
      this.editarUsuario(usuario);
    } else if (event.action === 'delete') {
      this.confirmarCambioEstadoUsuario(usuario);
    }
  }

  /**
   * Confirma el cambio de estado (activar/desactivar) de un usuario.
   * @param usuario - Usuario a cambiar
   */
  confirmarCambioEstadoUsuario(usuario: Usuario): void {
    this.confirmationService.confirm({
      message: `¿Confirmas desactivar al usuario ${usuario.nombre}?`,
      header: 'Desactivar usuario',
      icon: 'pi pi-question-circle',
      acceptLabel: 'Sí, desactivar',
      rejectLabel: 'Cancelar',
      accept: () => this.desactivarUsuario(usuario),
    });
  }

  private desactivarUsuario(usuario: Usuario): void {
    // Soft delete — el backend setea activo=false
    this.usuarioService.eliminar(usuario.id).subscribe({
      next: () => {
        this.usuarioService.eliminarDeEstado(usuario.id);
        this.messageService.add({
          severity: 'success',
          summary: 'Listo',
          detail: 'Usuario desactivado correctamente',
          life: 3000,
        });
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo desactivar el usuario',
          life: 4000,
        });
      },
    });
  }

  /**
   * Guarda un usuario nuevo o actualizado desde el formulario del dialog.
   * @param datos - Payload del formulario
   */
  guardarUsuario(datos: CrearUsuarioRequest | ActualizarUsuarioRequest): void {
    this.loadingGuardar = true;

    const obs = this.modoEdicion
      ? this.usuarioService.actualizar(this.usuarioSeleccionado!.id, datos as ActualizarUsuarioRequest)
      : this.usuarioService.crear(datos as CrearUsuarioRequest);

    obs.subscribe({
      next: (usuario) => {
        this.loadingGuardar = false;
        this.mostrarDialogUsuario = false;

        if (this.modoEdicion) {
          this.usuarioService.actualizarEnEstado(usuario);
        } else {
          this.usuarioService.agregarEnEstado(usuario);
        }

        this.messageService.add({
          severity: 'success',
          summary: 'Guardado',
          detail: `Usuario ${this.modoEdicion ? 'actualizado' : 'creado'} correctamente`,
          life: 3000,
        });
      },
      error: (err) => {
        this.loadingGuardar = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err.error?.message ?? 'No se pudo guardar el usuario',
          life: 4000,
        });
      },
    });
  }

  // ---- Acciones de Departamentos ----

  nuevoDepartamento(): void {
    this.deptoSeleccionado = null;
    this.modoEdicion = false;
    this.mostrarDialogDepartamento = true;
  }

  editarDepartamento(depto: Departamento): void {
    this.deptoSeleccionado = { ...depto };
    this.modoEdicion = true;
    this.mostrarDialogDepartamento = true;
  }

  onAccionDepartamento(event: { action: string; row: unknown }): void {
    const depto = event.row as Departamento;
    if (event.action === 'edit') {
      this.editarDepartamento(depto);
    } else if (event.action === 'delete') {
      this.confirmarCambioEstadoDepto(depto);
    }
  }

  confirmarCambioEstadoDepto(depto: Departamento): void {
    this.confirmationService.confirm({
      message: `¿Confirmas eliminar el departamento "${depto.nombre}"?`,
      header: 'Eliminar departamento',
      icon: 'pi pi-question-circle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      accept: () => {
        // Soft delete — el backend setea activo=false
        this.departamentoService.eliminar(depto.id).subscribe({
          next: () => {
            this.departamentoService.cargarDepartamentos();
            this.messageService.add({ severity: 'success', summary: 'Listo', detail: 'Departamento eliminado', life: 3000 });
          },
          error: (err) => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message ?? 'No se pudo eliminar', life: 4000 });
          },
        });
      },
    });
  }

  guardarDepartamento(datos: CrearDepartamentoRequest | ActualizarDepartamentoRequest): void {
    this.loadingGuardar = true;
    const obs = this.modoEdicion
      ? this.departamentoService.actualizar(this.deptoSeleccionado!.id, datos as ActualizarDepartamentoRequest)
      : this.departamentoService.crear(datos as CrearDepartamentoRequest);

    obs.subscribe({
      next: () => {
        this.loadingGuardar = false;
        this.mostrarDialogDepartamento = false;
        this.departamentoService.cargarDepartamentos();
        this.messageService.add({ severity: 'success', summary: 'Guardado', detail: 'Departamento guardado', life: 3000 });
      },
      error: (err) => {
        this.loadingGuardar = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message ?? 'No se pudo guardar', life: 4000 });
      },
    });
  }

  // ---- KPI helpers ----

  /** Retorna snapshot para estadísticas del header. */
  get totalUsuarios(): number {
    return this.usuarioService['usuariosSubject'].getValue().length;
  }
}
