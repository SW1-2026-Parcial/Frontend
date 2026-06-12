/*
 * MÓDULO: Supervisor
 * DESCRIPCIÓN: Historial de eventos de un trámite (CU-13)
 */

import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { MonitorService } from '../../services/monitor.service';
import { Tramite }        from '../../../../shared/models/tramite.model';
import {
  TramiteEvent,
  TipoEvento,
  EVENTO_LABELS,
  EVENTO_ICON,
  EVENTO_SEVERITY,
} from '../../../../shared/models/tramite-event.model';

@Component({
  selector:    'app-historial-tramite',
  standalone:  false,
  templateUrl: './historial-tramite.component.html',
  styleUrls:   ['./historial-tramite.component.scss'],
})
export class HistorialTramiteComponent implements OnInit, OnDestroy {

  tramiteId  = '';
  tramite:   Tramite | null = null;
  eventos:   TramiteEvent[] = [];
  loading    = false;
  errorMsg   = '';

  dialogVisible   = false;
  selectedTaskId: string | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private route:          ActivatedRoute,
    private router:         Router,
    private monitorService: MonitorService,
  ) {}

  ngOnInit(): void {
    this.tramiteId = this.route.snapshot.paramMap.get('id') ?? '';
    if (!this.tramiteId) {
      this.router.navigate(['/supervisor']);
      return;
    }
    this.cargarDatos();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private cargarDatos(): void {
    this.loading  = true;
    this.errorMsg = '';

    // Cargar el trámite para mostrar el ticket
    this.monitorService.obtenerTramite(this.tramiteId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: t => {
          this.tramite = t;
          this.cargarHistorial();
        },
        error: () => {
          this.loading  = false;
          this.errorMsg = 'No se pudo cargar el trámite.';
        },
      });
  }

  private cargarHistorial(): void {
    this.monitorService.obtenerHistorial(this.tramiteId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: eventos => {
          this.eventos = eventos;
          this.loading = false;
        },
        error: () => {
          this.loading  = false;
          this.errorMsg = 'No se pudo cargar el historial.';
        },
      });
  }

  volver(): void {
    this.router.navigate(['/supervisor']);
  }

  // ── Helpers de eventos ────────────────────────────────────────────────────────

  eventoLabel(tipo: TipoEvento): string {
    return EVENTO_LABELS[tipo] ?? tipo;
  }

  eventoIcon(tipo: TipoEvento): string {
    return EVENTO_ICON[tipo] ?? 'pi pi-circle';
  }

  eventoSeverity(tipo: TipoEvento): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    const s = EVENTO_SEVERITY[tipo] ?? 'secondary';
    return s as 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast';
  }

  abrirDetalleTarea(taskId: string): void {
    this.selectedTaskId = taskId;
    this.dialogVisible  = true;
  }

  hasFormData(evento: TramiteEvent): boolean {
    return !!evento.formData && Object.keys(evento.formData).length > 0;
  }

  formEntries(formData: Record<string, unknown>): { key: string; value: string }[] {
    return Object.entries(formData).map(([key, value]) => ({ key, value: String(value) }));
  }
}
