import { Component, OnInit, OnDestroy, ViewChild, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, forkJoin, of, from, switchMap, takeUntil, catchError } from 'rxjs';
import { MessageService } from 'primeng/api';

import { TareaService }   from '../../services/tarea.service';
import { Tarea, TareaDetalle } from '../../../../shared/models/tarea.model';
import { NodoUML, Calle } from '../../../../shared/models/politica.model';
import { NodoCompletado } from '../../../../shared/components/mini-diagrama/mini-diagrama.component';
import { TramiteService } from '../../services/tramite.service';
import { MonitorService } from '../../../supervisor/services/monitor.service';
import { DocumentoService } from '../../../documentos/services/documento.service';
import { FormularioDinamicoComponent } from '../../../../shared/components/formulario-dinamico/formulario-dinamico.component';

@Component({
  selector: 'app-ejecutar-tarea',
  standalone: false,
  templateUrl: './ejecutar-tarea.component.html',
  styleUrls: ['./ejecutar-tarea.component.scss'],
  providers: [MessageService],
})
export class EjecutarTareaComponent implements OnInit, OnDestroy {

  @ViewChild(FormularioDinamicoComponent) formulario!: FormularioDinamicoComponent;

  tarea:        TareaDetalle | null = null;
  loading       = true;
  loadingAccion = false;
  subiendoArchivos = false;

  formCampos!:  FormGroup;
  formRechazo!: FormGroup;

  mostrarDialogRechazo = false;

  diagramaColapsado = false;
  nodosDiagrama: NodoUML[] = [];
  callesDiagrama: Calle[] = [];
  nodosCompletados: NodoCompletado[] = [];
  dialogHistorialVisible = false;
  selectedTaskId: string | null = null;

  readonly ramasDecision = [
    { label: 'Principal (éxito)',     value: false },
    { label: 'Alternativa (rechazo)', value: true  },
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private route:            ActivatedRoute,
    private router:           Router,
    private fb:               FormBuilder,
    private tareaService:     TareaService,
    private messageService:   MessageService,
    private tramiteService:   TramiteService,
    private monitorService:   MonitorService,
    private documentoService: DocumentoService,
    private cdr:              ChangeDetectorRef,
  ) {
    this.formCampos  = this.fb.group({});
    this.formRechazo = this.fb.group({
      motivo: ['', [Validators.required, Validators.minLength(10)]],
    });
  }

  ngOnInit(): void {
    const tareaId = this.route.snapshot.paramMap.get('id')!;

    // 1er intento: state de navegación o snapshot del servicio (caso normal desde bandeja)
    const tareaEnMemoria: Tarea | undefined =
      (history.state as any)?.tarea ??
      this.tareaService.getTareasSnapshot().find(t => t.id === tareaId);

    // Si no hay estado local, buscamos la tarea en el servidor (URL directa o refresh)
    const tarea$ = tareaEnMemoria
      ? of(tareaEnMemoria)
      : this.tareaService.obtenerTareaById(tareaId);

    tarea$.pipe(
      switchMap(tareaBase => this.tareaService.obtenerDetalle(tareaBase)),
      takeUntil(this.destroy$),
    ).subscribe({
      next: tarea => {
        this.tarea   = tarea;
        this.loading = false;
        if (tarea.nodoTieneDecision) {
          this.formCampos.addControl('_rama', this.fb.control(null, Validators.required));
        }
        this.cdr.detectChanges();
        this.cargarDiagrama();
      },
      error: err => {
        this.loading = false;
        this.messageService.add({
          severity: 'error', summary: 'Tarea no disponible',
          detail: err?.message ?? err?.error?.message ?? 'No se pudo cargar la tarea', life: 4000,
        });
        this.cdr.detectChanges();
        this.router.navigate(['/motor']);
      },
    });
  }

  private cargarDiagrama(): void {
    if (!this.tarea) return;
    const tramiteId = this.tarea.tramiteId;

    this.tramiteService.obtenerTramite(tramiteId).pipe(
      switchMap(tramite => tramite
        ? this.tramiteService.obtenerDiagramaPublicado(tramite.politicaId)
        : of(null)
      ),
      catchError(() => of(null)),
      takeUntil(this.destroy$),
    ).subscribe(diagrama => {
      if (diagrama) {
        this.nodosDiagrama  = diagrama.nodos;
        this.callesDiagrama = diagrama.calles;
      }
    });

    this.monitorService.obtenerHistorial(tramiteId)
      .pipe(catchError(() => of([])), takeUntil(this.destroy$))
      .subscribe(eventos => {
        this.nodosCompletados = eventos
          .filter(e => e.tipo === 'TASK_COMPLETED' && e.taskId && e.nodeId)
          .map(e => ({ nodoId: e.nodeId!, taskId: e.taskId! }));
      });
  }

  abrirHistorialNodo(nodoCompletado: NodoCompletado): void {
    this.selectedTaskId         = nodoCompletado.taskId;
    this.dialogHistorialVisible = true;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Completar ────────────────────────────────────────────────────────────────

  completar(): void {
    if (this.formCampos.invalid) {
      this.formCampos.markAllAsTouched();
      return;
    }
    if (!this.tarea) return;

    const rawValue = { ...this.formCampos.value };
    const branchSelected: boolean | null = this.tarea.nodoTieneDecision
      ? rawValue['_rama']
      : null;
    delete rawValue['_rama'];

    const archivos = this.formulario?.archivosSeleccionados ?? new Map<string, File>();

    if (archivos.size === 0) {
      // Sin archivos — completar directamente
      this._enviarCompletarTarea(rawValue, branchSelected);
      return;
    }

    // Subir cada archivo a Azure antes de completar la tarea
    this.subiendoArchivos = true;
    this.loadingAccion    = true;

    const uploads$ = Array.from(archivos.entries()).map(([campo, file]) =>
      this.documentoService.subir(file, { tramiteId: this.tarea!.tramiteId }).pipe(
        catchError(err => {
          throw new Error(`Error subiendo "${file.name}": ${err?.error?.detail ?? err?.message ?? 'Error desconocido'}`);
        }),
      )
    );
    const campos = Array.from(archivos.keys());

    forkJoin(uploads$).subscribe({
      next: documentos => {
        this.subiendoArchivos = false;
        campos.forEach((campo, i) => {
          rawValue[campo] = documentos[i].id;
        });
        this.cdr.detectChanges();
        this._enviarCompletarTarea(rawValue, branchSelected);
      },
      error: err => {
        this.subiendoArchivos = false;
        this.loadingAccion    = false;
        this.messageService.add({
          severity: 'error', summary: 'Error al subir archivo',
          detail: err?.message ?? 'No se pudo subir uno o más archivos', life: 6000,
        });
        this.cdr.detectChanges();
      },
    });
  }

  private _enviarCompletarTarea(formData: Record<string, unknown>, branchSelected: boolean | null): void {
    this.loadingAccion = true;
    this.tareaService.completarTarea(this.tarea!.id, {
      formData,
      ...(branchSelected !== null && { branchSelected }),
    }).subscribe({
      next: () => {
        this.loadingAccion = false;
        this.messageService.add({
          severity: 'success', summary: 'Tarea completada',
          detail: 'El trámite avanzó al siguiente paso', life: 3000,
        });
        this.cdr.detectChanges();
        setTimeout(() => this.router.navigate(['/motor']), 1500);
      },
      error: err => {
        this.loadingAccion = false;
        this.messageService.add({
          severity: 'error', summary: 'Error',
          detail: err?.error?.message ?? 'No se pudo completar la tarea', life: 5000,
        });
        this.cdr.detectChanges();
      },
    });
  }

  // ── Rechazar ─────────────────────────────────────────────────────────────────

  abrirDialogRechazo(): void {
    this.formRechazo.reset();
    this.mostrarDialogRechazo = true;
  }

  confirmarRechazo(): void {
    if (this.formRechazo.invalid) {
      this.formRechazo.markAllAsTouched();
      return;
    }
    if (!this.tarea) return;

    const { motivo } = this.formRechazo.value;
    this.loadingAccion = true;

    this.tareaService.rechazarTarea(this.tarea.id, motivo).subscribe({
      next: () => {
        this.loadingAccion = false;
        this.mostrarDialogRechazo = false;
        this.messageService.add({
          severity: 'warn', summary: 'Trámite cancelado',
          detail: 'El trámite ha sido cancelado y todas sus tareas cerradas', life: 4000,
        });
        this.cdr.detectChanges();
        setTimeout(() => this.router.navigate(['/motor']), 1500);
      },
      error: err => {
        this.loadingAccion = false;
        this.messageService.add({
          severity: 'error', summary: 'Error',
          detail: err?.error?.message ?? 'No se pudo rechazar la tarea', life: 5000,
        });
        this.cdr.detectChanges();
      },
    });
  }

  volver(): void {
    this.router.navigate(['/motor']);
  }

  errorMotivo(): string {
    const ctrl = this.formRechazo.get('motivo');
    if (!ctrl?.touched || !ctrl.invalid) return '';
    if (ctrl.errors?.['required'])   return 'El motivo es requerido';
    if (ctrl.errors?.['minlength'])  return `Mínimo ${ctrl.errors['minlength'].requiredLength} caracteres`;
    return '';
  }
}
