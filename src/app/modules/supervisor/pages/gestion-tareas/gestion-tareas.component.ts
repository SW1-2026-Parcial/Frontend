import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Subject, takeUntil, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { MessageService } from 'primeng/api';

import { TareaService }   from '../../../motor/services/tarea.service';
import { Tarea }          from '../../../../shared/models/tarea.model';
import { Usuario }        from '../../../../shared/models/usuario.model';
import { environment }    from '../../../../../environments/environment';

@Component({
  selector:    'app-gestion-tareas',
  standalone:  false,
  templateUrl: './gestion-tareas.component.html',
  styleUrls:   ['./gestion-tareas.component.scss'],
  providers:   [MessageService],
})
export class GestionTareasComponent implements OnInit, OnDestroy {

  tareas:    Tarea[]   = [];
  loading    = false;
  textoBusqueda = '';

  // ── Diálogo de delegación ─────────────────────────────────────────────────
  mostrarDlgDelegar    = false;
  tareaDelegar:         Tarea | null = null;
  funcionarios:         (Usuario & { departamentoNombre?: string | null })[] = [];
  funcionarioElegido:   (Usuario & { departamentoNombre?: string | null }) | null = null;
  cargandoFuncionarios = false;
  delegando            = false;

  // ── Diálogo de rechazo ────────────────────────────────────────────────────
  mostrarDlgRechazar  = false;
  tareaRechazar:       Tarea | null = null;
  motivoRechazo       = '';
  rechazando          = false;

  // El dialog de completar ya no se usa — "Completar" navega al formulario
  mostrarDlgCompletar = false;
  tareaCompletar:      Tarea | null = null;
  completando         = false;

  private readonly BASE = environment.apiUrl;
  private destroy$ = new Subject<void>();

  /** Mapa departamentoId → nombre, cargado una vez en ngOnInit */
  private deptoMap: Record<string, string> = {};

  constructor(
    private tareaService: TareaService,
    private http:         HttpClient,
    private cdr:          ChangeDetectorRef,
    private msg:          MessageService,
    private router:       Router,
  ) {}

  ngOnInit(): void {
    // Pre-cargar departamentos para el selector de delegación
    this.http.get<{ id: string; nombre: string }[]>(`${this.BASE}/departamentos`).pipe(
      catchError(() => of([])),
    ).subscribe(deptos => {
      this.deptoMap = Object.fromEntries(deptos.map(d => [d.id, d.nombre]));
    });
    this.cargar();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  cargar(): void {
    this.loading = true;
    this.http.get<Tarea[]>(`${this.BASE}/tasks/available`).pipe(
      catchError(() => of([])),
      takeUntil(this.destroy$),
    ).subscribe(tareas => {
      this.tareas  = tareas;
      this.loading = false;
      this.cdr.detectChanges();
    });
  }

  get tareasFiltradas(): Tarea[] {
    const texto = this.textoBusqueda.trim().toLowerCase();
    if (!texto) return this.tareas;
    return this.tareas.filter(t =>
      t.tramiteTicket?.toLowerCase().includes(texto) ||
      t.politicaNombre?.toLowerCase().includes(texto) ||
      t.nodoNombre?.toLowerCase().includes(texto) ||
      t.departamentoNombre?.toLowerCase().includes(texto),
    );
  }

  // ── Delegar ───────────────────────────────────────────────────────────────

  abrirDelegar(tarea: Tarea): void {
    this.tareaDelegar        = tarea;
    this.funcionarioElegido  = null;
    this.mostrarDlgDelegar   = true;
    this.cargandoFuncionarios = true;

    this.http.get<Usuario[]>(`${this.BASE}/users`).pipe(
      catchError(() => of([])),
    ).subscribe(users => {
      // Enriquecer cada funcionario con el nombre del departamento
      this.funcionarios = users
        .filter(u => u.rol === 'FUNCIONARIO' && u.activo !== false)
        .map(u => ({
          ...u,
          departamentoNombre: u.departamentoId
            ? (this.deptoMap[u.departamentoId] ?? null)
            : null,
        }));
      this.cargandoFuncionarios = false;
      this.cdr.detectChanges();
    });
  }

  confirmarDelegar(): void {
    if (!this.tareaDelegar || !this.funcionarioElegido) return;
    this.delegando = true;
    this.tareaService.delegarTarea(this.tareaDelegar.id, this.funcionarioElegido.id).subscribe({
      next: () => {
        this.delegando = false;
        this.mostrarDlgDelegar = false;
        this.msg.add({ severity: 'success', summary: 'Tarea delegada',
          detail: `Asignada a ${this.funcionarioElegido!.nombre}`, life: 4000 });
        this.quitarTareaLocal(this.tareaDelegar!.id);
        this.tareaDelegar = null;
        this.cdr.detectChanges();
      },
      error: err => {
        this.delegando = false;
        this.msg.add({ severity: 'error', summary: 'Error',
          detail: err?.error?.message ?? 'No se pudo delegar', life: 5000 });
        this.cdr.detectChanges();
      },
    });
  }

  // ── Rechazar ──────────────────────────────────────────────────────────────

  abrirRechazar(tarea: Tarea): void {
    this.tareaRechazar      = tarea;
    this.motivoRechazo      = '';
    this.mostrarDlgRechazar = true;
  }

  confirmarRechazar(): void {
    if (!this.tareaRechazar || !this.motivoRechazo.trim()) return;
    this.rechazando = true;
    this.tareaService.rechazarTarea(this.tareaRechazar.id, this.motivoRechazo).subscribe({
      next: () => {
        this.rechazando = false;
        this.mostrarDlgRechazar = false;
        this.msg.add({ severity: 'warn', summary: 'Tarea rechazada', life: 4000 });
        this.quitarTareaLocal(this.tareaRechazar!.id);
        this.tareaRechazar = null;
        this.cdr.detectChanges();
      },
      error: err => {
        this.rechazando = false;
        this.msg.add({ severity: 'error', summary: 'Error',
          detail: err?.error?.message ?? 'No se pudo rechazar', life: 5000 });
        this.cdr.detectChanges();
      },
    });
  }

  // ── Completar — navega al formulario de la tarea ──────────────────────────

  abrirCompletar(tarea: Tarea): void {
    // En lugar de completar sin formulario, navegar a la pantalla
    // de ejecución para que se llene el formulario correctamente
    this.router.navigate(['/motor/tareas', tarea.id]);
  }

  confirmarCompletar(): void {
    // No-op — el dialog ya no se usa, pero se mantiene para el template
    this.mostrarDlgCompletar = false;
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private quitarTareaLocal(id: string): void {
    this.tareas = this.tareas.filter(t => t.id !== id);
  }
}
