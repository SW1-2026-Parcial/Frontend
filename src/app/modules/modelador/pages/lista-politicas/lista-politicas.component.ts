/*
 * MÓDULO: M1 Modelador
 * CASO DE USO: CU-02 — Lista y gestión de políticas
 * ACTOR: Administrador
 * DESCRIPCIÓN: Smart Component — lista de políticas con CRUD y ciclo de vida
 */

import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MessageService, ConfirmationService } from 'primeng/api';
import { Subject, takeUntil } from 'rxjs';

import { PoliticaService } from '../../services/politica.service';
import { Politica, ESTADO_POLITICA_LABELS } from '../../../../shared/models/politica.model';
import { TableColumn } from '../../../../shared/components/sp1-table/sp1-table.component';

@Component({
  selector: 'app-lista-politicas',
  standalone: false,
  templateUrl: './lista-politicas.component.html',
  styleUrls: ['./lista-politicas.component.scss'],
  providers: [MessageService, ConfirmationService],
})
export class ListaPoliticasComponent implements OnInit, OnDestroy {
  politicas$!: PoliticaService['politicas$'];
  loading$!: PoliticaService['loading$'];

  mostrarDialogNueva = false;
  loadingGuardar     = false;

  formNueva!: FormGroup;

  columnas: TableColumn[] = [
    { key: 'nombre',       header: 'Nombre',    type: 'text',   sortable: true },
    { key: 'descripcion',  header: 'Descripción', type: 'text' },
    { key: 'estado',       header: 'Estado',    type: 'badge',  sortable: true },
    { key: 'versionActual', header: 'Versión',  type: 'number', width: '80px', align: 'center' },
    { key: 'creadoEn',     header: 'Creada',    type: 'date',   sortable: true },
    { key: 'acciones',     header: 'Acciones',  type: 'actions', width: '180px' },
  ];

  readonly estadoLabels = ESTADO_POLITICA_LABELS;
  private destroy$ = new Subject<void>();

  constructor(
    private politicaService:    PoliticaService,
    private router:             Router,
    private fb:                 FormBuilder,
    private messageService:     MessageService,
    private confirmationService: ConfirmationService,
  ) {
    this.politicas$ = politicaService.politicas$;
    this.loading$   = politicaService.loading$;
  }

  ngOnInit(): void {
    this.politicaService.cargarPoliticas();
    this.formNueva = this.fb.group({
      nombre:      ['', [Validators.required, Validators.minLength(5)]],
      descripcion: ['', Validators.required],
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /** Navega al editor de diagrama de una política. */
  abrirEditor(politica: Politica): void {
    this.politicaService.setPoliticaActual(politica);
    this.router.navigate(['/modelador/editor', politica.id]);
  }

  onRowClick(row: unknown): void {
    this.abrirEditor(row as Politica);
  }

  onAccion(event: { action: string; row: unknown }): void {
    const politica = event.row as Politica;
    if (event.action === 'edit') {
      this.abrirEditor(politica);
    } else if (event.action === 'delete') {
      this.confirmarArchivar(politica);
    }
  }

  crearPolitica(): void {
    if (this.formNueva.invalid) { this.formNueva.markAllAsTouched(); return; }
    this.loadingGuardar = true;

    this.politicaService.crear(this.formNueva.value).subscribe({
      next: (politica) => {
        this.loadingGuardar = false;
        this.mostrarDialogNueva = false;
        this.politicaService.agregarEnEstado(politica);
        this.formNueva.reset();
        this.messageService.add({ severity: 'success', summary: 'Creada', detail: `Política "${politica.nombre}" creada en Borrador`, life: 3000 });
        // Navega al editor inmediatamente
        setTimeout(() => this.abrirEditor(politica), 500);
      },
      error: (err) => {
        this.loadingGuardar = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message ?? 'No se pudo crear la política', life: 4000 });
      },
    });
  }

  confirmarArchivar(politica: Politica): void {
    this.confirmationService.confirm({
      message: `¿Archivar la política "${politica.nombre}"? Se eliminará del listado principal.`,
      header: 'Archivar política',
      icon: 'pi pi-inbox',
      acceptLabel: 'Sí, archivar',
      rejectLabel: 'Cancelar',
      accept: () => {
        // DELETE /api/policies/{id} retorna 204 sin body — setea estado=ARCHIVED en backend
        this.politicaService.archivar(politica.id).subscribe({
          next: () => {
            // Recargar la lista — la política archivada ya no aparece en GET /api/policies
            this.politicaService.cargarPoliticas();
            this.messageService.add({ severity: 'info', summary: 'Archivada', detail: `Política "${politica.nombre}" archivada`, life: 3000 });
          },
          error: (err) => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message ?? 'No se pudo archivar', life: 4000 });
          },
        });
      },
    });
  }

  errorDe(campo: string): string {
    const ctrl = this.formNueva.get(campo);
    if (!ctrl?.touched || !ctrl.invalid) return '';
    if (ctrl.errors?.['required'])  return 'Este campo es requerido';
    if (ctrl.errors?.['minlength']) return `Mínimo ${ctrl.errors['minlength'].requiredLength} caracteres`;
    return '';
  }

  esInvalido(campo: string): boolean {
    const ctrl = this.formNueva.get(campo);
    return !!(ctrl?.touched && ctrl.invalid);
  }
}
