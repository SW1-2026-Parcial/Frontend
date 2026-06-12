import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';

import { ArchivoInfo, TaskDetailResponse } from '../../models/tarea.model';
// Consolidado: TaskDetailService fue eliminado. Se usa TareaService directamente.
import { TareaService } from '../../../modules/motor/services/tarea.service';

@Component({
  selector:    'app-tarea-historial-dialog',
  standalone:  false,
  templateUrl: './tarea-historial-dialog.component.html',
})
export class TareaHistorialDialogComponent implements OnChanges, OnDestroy {

  @Input()  visible = false;
  @Input()  taskId: string | null = null;
  @Output() visibleChange = new EventEmitter<boolean>();

  detalle:  TaskDetailResponse | null = null;
  cargando  = false;
  error     = false;

  private destroy$ = new Subject<void>();

  constructor(
    private tareaService: TareaService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['taskId'] || changes['visible']) && this.visible && this.taskId && !this.detalle && !this.cargando) {
      this.cargarDetalle();
    }
    if (changes['visible'] && !this.visible) {
      this.detalle = null;
      this.error   = false;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private cargarDetalle(): void {
    this.cargando = true;
    this.error    = false;
    this.detalle  = null;
    this.tareaService.getDetallePorId(this.taskId!)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next:  (d) => { this.detalle = d; this.cargando = false; this.cdr.detectChanges(); },
        error: ()  => { this.error   = true; this.cargando = false; this.cdr.detectChanges(); },
      });
  }

  getValorCampo(clave: string): unknown {
    return this.detalle?.formData?.[clave];
  }

  getArchivoInfo(clave: string): ArchivoInfo | null {
    return this.detalle?.archivos?.find(a => a.clave === clave) ?? null;
  }

  descargarArchivo(downloadUrl: string, nombreArchivo: string): void {
    const link = document.createElement('a');
    link.href       = downloadUrl;
    link.download   = nombreArchivo;
    link.target     = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  cerrar(): void {
    this.visibleChange.emit(false);
    this.detalle = null;
  }
}
