/*
 * MÓDULO: Supervisor
 * DESCRIPCIÓN: Dashboard de monitoreo de trámites en tiempo real (CU-11)
 */

import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { MonitorService }      from '../../services/monitor.service';
import { RealTimeService }     from '../../../../core/services/real-time.service';
import { Tramite, EstadoTramite, TramiteWsPayload } from '../../../../shared/models/tramite.model';
import { environment } from '../../../../../environments/environment';

interface FiltrosDashboard {
  status?: EstadoTramite;
  politicaId?: string;
}

interface StatusOption {
  label: string;
  value: EstadoTramite | undefined;
}

interface PoliticaOpcion {
  label: string;
  value: string | undefined;
}

@Component({
  selector:    'app-dashboard-tramites',
  standalone:  false,
  templateUrl: './dashboard-tramites.component.html',
  styleUrls:   ['./dashboard-tramites.component.scss'],
})
export class DashboardTramitesComponent implements OnInit, OnDestroy {

  tramites:  Tramite[] = [];
  loading    = false;
  filtros:   FiltrosDashboard = {};

  textoBusqueda = '';
  politicaOpciones: PoliticaOpcion[] = [{ label: 'Todos los procesos', value: undefined }];
  politicaSeleccionada: PoliticaOpcion = this.politicaOpciones[0];
  politicasMap: Record<string, string> = {};

  readonly statusOpciones: StatusOption[] = [
    { label: 'Todos',      value: undefined },
    { label: 'Activos',    value: 'ACTIVE' },
    { label: 'Completados', value: 'COMPLETED' },
    { label: 'Rechazados', value: 'REJECTED' },
    { label: 'Cancelados', value: 'CANCELLED' },
  ];

  statusSeleccionado: StatusOption = this.statusOpciones[0];

  private readonly BASE = environment.apiUrl;
  private destroy$ = new Subject<void>();

  constructor(
    private monitorService:   MonitorService,
    private rt:               RealTimeService,
    private http:             HttpClient,
    private router:           Router,
    private cdr:              ChangeDetectorRef,
  ) {}

  /** IDs de trámites a los que ya nos suscribimos — evita duplicar suscripciones WS. */
  private tramitesWsSuscritos = new Set<string>();

  ngOnInit(): void {
    this.cargarPoliticas();

    this.monitorService.loading$
      .pipe(takeUntil(this.destroy$))
      .subscribe(l => this.loading = l);

    this.monitorService.tramites$
      .pipe(takeUntil(this.destroy$))
      .subscribe(tramites => {
        this.tramites = tramites;
        this.cdr.detectChanges();
        // Suscribirse a updates WS de cada trámite activo (sin duplicar).
        // Se hace después de cdr.detectChanges() para que el error WS no
        // interrumpa el ciclo de CD si la conexión STOMP aún no está lista.
        tramites
          .filter(t => t.status === 'ACTIVE' && !this.tramitesWsSuscritos.has(t.id))
          .forEach(t => {
            this.tramitesWsSuscritos.add(t.id);
            this.rt.tramite$(t.id)
              .pipe(takeUntil(this.destroy$))
              .subscribe(payload => this.onTramiteUpdate(payload));
          });
      });

    this.monitorService.cargarTramites();
  }

  /** Aplica el payload WS al trámite correspondiente en la lista local.
   *  Si el trámite ya no está activo o no se encuentra, recarga la lista completa. */
  private onTramiteUpdate(payload: TramiteWsPayload): void {
    const idx = this.tramites.findIndex(t => t.id === payload.tramiteId);
    if (idx === -1) {
      // Trámite nuevo o no cargado aún → recarga completa
      this.monitorService.cargarTramites(this.filtros);
      return;
    }
    // Actualizar en-place: solo status y nodos activos
    const actualizado: Tramite = {
      ...this.tramites[idx],
      status:         payload.status,
      currentNodeIds: payload.currentNodeIds,
    };
    this.tramites = [
      ...this.tramites.slice(0, idx),
      actualizado,
      ...this.tramites.slice(idx + 1),
    ];
    this.cdr.detectChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Carga de políticas para el filtro ────────────────────────────────────────

  private cargarPoliticas(): void {
    this.http.get<{ id: string; nombre: string; estado?: string; status?: string }[]>(
      `${this.BASE}/policies`,
    ).subscribe({
      next: all => {
        const publicadas = all.filter(p => {
          const estado = p.estado ?? (p as any)['status'] ?? (p as any)['state'];
          return estado === 'PUBLISHED';
        });
        this.politicasMap = {};
        publicadas.forEach(p => { this.politicasMap[p.id] = p.nombre; });
        this.politicaOpciones = [
          { label: 'Todos los procesos', value: undefined },
          ...publicadas.map(p => ({ label: p.nombre, value: p.id })),
        ];
        this.cdr.detectChanges();
      },
    });
  }

  nombrePolitica(tramite: Tramite): string {
    return tramite.politicaNombre ?? this.politicasMap[tramite.politicaId] ?? '—';
  }

  // ── Filtros ──────────────────────────────────────────────────────────────────

  get tramitesFiltrados(): Tramite[] {
    const texto = this.textoBusqueda.trim().toLowerCase();
    if (!texto) return this.tramites;
    return this.tramites.filter(t =>
      t.ticketNumber?.toLowerCase().includes(texto) ||
      (this.nombrePolitica(t)).toLowerCase().includes(texto),
    );
  }

  get tieneFiltros(): boolean {
    return !!this.filtros.status || !!this.filtros.politicaId || !!this.textoBusqueda.trim();
  }

  aplicarFiltroStatus(): void {
    this.filtros = { ...this.filtros, status: this.statusSeleccionado.value };
    this.monitorService.cargarTramites(this.filtros);
  }

  aplicarFiltroPolitica(): void {
    this.filtros = { ...this.filtros, politicaId: this.politicaSeleccionada.value };
    this.monitorService.cargarTramites(this.filtros);
  }

  limpiarFiltros(): void {
    this.filtros              = {};
    this.statusSeleccionado   = this.statusOpciones[0];
    this.politicaSeleccionada = this.politicaOpciones[0];
    this.textoBusqueda        = '';
    this.monitorService.cargarTramites();
  }

  actualizar(): void {
    this.monitorService.cargarTramites(this.filtros);
  }

  // ── Navegación ───────────────────────────────────────────────────────────────

  verHistorial(tramite: Tramite): void {
    this.router.navigate(['/supervisor/tramites', tramite.id, 'historial']);
  }

  // ── KPIs ─────────────────────────────────────────────────────────────────────

  get totalTramites(): number    { return this.tramites.length; }
  get tramitesActivos(): number  { return this.tramites.filter(t => t.status === 'ACTIVE').length; }
  get tramitesCompletados(): number { return this.tramites.filter(t => t.status === 'COMPLETED').length; }
  get tramitesRechazados(): number  { return this.tramites.filter(t => t.status === 'REJECTED').length; }
}
