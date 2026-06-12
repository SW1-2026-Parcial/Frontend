import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { MessageService } from 'primeng/api';

import { TareaService }      from '../../services/tarea.service';
import { AuthService }       from '../../../../core/auth/auth.service';
import { RealTimeService }   from '../../../../core/services/real-time.service';
import { Tarea }             from '../../../../shared/models/tarea.model';
import { TareaWsPayload }    from '../../../../shared/models/tramite.model';

@Component({
  selector: 'app-bandeja-tareas',
  standalone: false,
  templateUrl: './bandeja-tareas.component.html',
  styleUrls: ['./bandeja-tareas.component.scss'],
  providers: [MessageService],
})
export class BandejaTareasComponent implements OnInit, OnDestroy {

  tareas:        Tarea[] = [];
  /** true solo mientras llega la primera carga — oculta los tabs hasta tener datos. */
  loadingInicial = true;
  /** true durante cualquier fetch (controla botón Actualizar y spinner de fondo). */
  loading        = false;
  tabActivo      = '0';
  tomandoId:     string | null = null;
  textoBusqueda  = '';

  private destroy$ = new Subject<void>();

  constructor(
    private tareaService:     TareaService,
    private authService:      AuthService,
    private router:           Router,
    private messageService:   MessageService,
    private rt:               RealTimeService,
    private cdr:              ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.tareaService.loading$
      .pipe(takeUntil(this.destroy$))
      .subscribe(l => {
        this.loading = l;
        if (!l && this.loadingInicial) this.loadingInicial = false;
        this.cdr.detectChanges();
      });

    this.tareaService.tareas$
      .pipe(takeUntil(this.destroy$))
      .subscribe(t => { this.tareas = t; this.cdr.detectChanges(); });

    this.tareaService.cargarBandeja();

    const deptoId = this.authService.getUsuarioActual()?.departamentoId;
    if (deptoId) {
      this.rt.tareas$(deptoId)
        .pipe(takeUntil(this.destroy$))
        .subscribe(payload => {
          // Nueva tarea delegada → refrescar bandeja + notificar
          this.tareaService.cargarBandeja();
          this.messageService.add({
            severity: 'info',
            summary:  'Nueva tarea asignada',
            detail:   `${payload.nodoEtiqueta} · ${payload.tramiteTicket}`,
            life:     6000,
          });
        });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get usuarioId(): string {
    return this.authService.getUsuarioActual()?.id ?? '';
  }

  get esSupervisor(): boolean {
    return this.authService.getUsuarioActual()?.rol === 'SUPERVISOR';
  }

  get tareasDisponibles(): Tarea[] {
    // PENDING sin asignar — vienen de GET /tasks/available
    const base = this.tareas.filter(t => t.status === 'PENDING');
    return this.filtrarPorBusqueda(base);
  }

  get misTareas(): Tarea[] {
    // IN_PROGRESS — vienen de GET /tasks/my-tasks (ya están asignadas a este usuario)
    const base = this.tareas.filter(t => t.status === 'IN_PROGRESS');
    return this.filtrarPorBusqueda(base);
  }

  private filtrarPorBusqueda(lista: Tarea[]): Tarea[] {
    const texto = this.textoBusqueda.trim().toLowerCase();
    if (!texto) return lista;
    return lista.filter(t =>
      t.tramiteTicket?.toLowerCase().includes(texto) ||
      t.politicaNombre?.toLowerCase().includes(texto) ||
      t.nodoNombre?.toLowerCase().includes(texto),
    );
  }

  tomar(tarea: Tarea): void {
    if (this.tomandoId) return;
    this.tomandoId = tarea.id;
    this.tareaService.tomarTarea(tarea.id).subscribe({
      next: () => {
        this.tomandoId = null;
        this.tabActivo = '1';
        this.messageService.add({
          severity: 'success', summary: 'Tarea tomada',
          detail: `"${tarea.nodoNombre}" asignada a ti`, life: 3000,
        });
        // Recarga desde el servidor para obtener datos completos (ticket, assignedTo, etc.)
        this.tareaService.cargarBandeja();
      },
      error: err => {
        this.tomandoId = null;
        this.messageService.add({
          severity: 'error', summary: 'Error',
          detail: err?.error?.message ?? 'No se pudo tomar la tarea', life: 4000,
        });
        this.cdr.detectChanges();
      },
    });
  }

  continuar(tarea: Tarea): void {
    this.router.navigate(['/motor/tareas', tarea.id], { state: { tarea } });
  }

  actualizar(): void {
    this.tareaService.cargarBandeja();
  }

  iniciarTramite(): void {
    this.router.navigate(['/motor/politicas']);
  }
}
