import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, forkJoin, of, switchMap, tap } from 'rxjs';
import { map } from 'rxjs/operators';
import { CampoDefinicion, NodoUML } from '../../../shared/models/politica.model';

import {
  Tarea, TareaDetalle,
  CompletarTareaRequest, RechazarTareaRequest,
  TaskDetailResponse,
} from '../../../shared/models/tarea.model';
import { Tramite } from '../../../shared/models/tramite.model';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class TareaService {

  private readonly BASE = `${environment.apiUrl}/tasks`;

  private tareasSubject  = new BehaviorSubject<Tarea[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);

  tareas$  = this.tareasSubject.asObservable();
  loading$ = this.loadingSubject.asObservable();

  constructor(private http: HttpClient) {}

  // ── Carga ─────────────────────────────────────────────────────────────────────

  /**
   * Llama en paralelo a:
   *   GET /tasks/available  → PENDING sin asignar del departamento del usuario
   *   GET /tasks/my-tasks   → IN_PROGRESS asignadas al usuario
   * y combina el resultado en un solo array.
   */
  cargarBandeja(): void {
    this.loadingSubject.next(true);
    forkJoin({
      disponibles: this.http.get<Tarea[]>(`${this.BASE}/available`).pipe(catchError(() => of([]))),
      mias:        this.http.get<Tarea[]>(`${this.BASE}/my-tasks`).pipe(catchError(() => of([]))),
    }).pipe(
      map(({ disponibles, mias }) => {
        // Evita duplicados si el mismo ID aparece en ambas listas
        const vistas = new Set<string>();
        const merged: Tarea[] = [];
        for (const t of [...disponibles, ...mias]) {
          if (!vistas.has(t.id)) { vistas.add(t.id); merged.push(t); }
        }
        return merged;
      }),
    ).subscribe({
      next: tareas => {
        this.tareasSubject.next(tareas);
        this.loadingSubject.next(false);
      },
      error: () => this.loadingSubject.next(false),
    });
  }

  /**
   * Busca una tarea por id llamando a available + my-tasks en paralelo.
   * Sirve como fallback cuando history.state no tiene la tarea (URL directa, refresh).
   */
  obtenerTareaById(id: string): Observable<Tarea> {
    return forkJoin({
      mias:        this.http.get<Tarea[]>(`${this.BASE}/my-tasks`).pipe(catchError(() => of([]))),
      disponibles: this.http.get<Tarea[]>(`${this.BASE}/available`).pipe(catchError(() => of([]))),
    }).pipe(
      map(({ mias, disponibles }) => {
        const found = [...mias, ...disponibles].find(t => t.id === id);
        if (!found) throw new Error('Tarea no encontrada');
        return found;
      }),
    );
  }

  /**
   * Construye un TareaDetalle completo sin usar GET /tasks/{id} (no existe).
   * Flujo: GET /tramites/{tramiteId} → versionPoliticaId
   *        GET /versions/{versionId}/nodes/{nodeId} → formulario + instrucciones
   */
  obtenerDetalle(tarea: Tarea): Observable<TareaDetalle> {
    const base = environment.apiUrl;
    return this.http.get<Tramite>(`${base}/tramites/${tarea.tramiteId}`).pipe(
      switchMap(tramite =>
        this.http.get<NodoUML>(`${base}/versions/${tramite.versionPoliticaId}/nodes/${tarea.nodeId}`)
      ),
      map(nodo => ({
        ...tarea,
        nodoFormulario:     nodo.formulario         ?? [],
        instruccionAvance:  nodo.instruccionAvance  ?? null,
        instruccionRechazo: nodo.instruccionRechazo ?? null,
        nodoTieneDecision:  nodo.salidas?.some(s => s.rama === true) ?? false,
      } as TareaDetalle)),
    );
  }

  // ── Acciones ─────────────────────────────────────────────────────────────────

  tomarTarea(id: string): Observable<Tarea> {
    return this.http
      .patch<Tarea>(`${this.BASE}/${id}/take`, {})
      .pipe(tap(actualizada => this.actualizarEnEstado(actualizada)));
  }

  completarTarea(id: string, body: CompletarTareaRequest): Observable<Tarea> {
    return this.http
      .post<Tarea>(`${this.BASE}/${id}/complete`, body)
      .pipe(tap(actualizada => this.actualizarEnEstado(actualizada)));
  }

  rechazarTarea(id: string, motivo: string): Observable<Tarea> {
    const body: RechazarTareaRequest = { motivo };
    return this.http
      .post<Tarea>(`${this.BASE}/${id}/reject`, body)
      .pipe(tap(actualizada => this.actualizarEnEstado(actualizada)));
  }

  delegarTarea(id: string, funcionarioId: string): Observable<Tarea> {
    return this.http
      .post<Tarea>(`${this.BASE}/${id}/delegate`, { nuevoAsignadoId: funcionarioId })
      .pipe(tap(actualizada => this.actualizarEnEstado(actualizada)));
  }

  // ── Mutaciones locales ────────────────────────────────────────────────────────

  private actualizarEnEstado(tarea: Tarea): void {
    const current = this.tareasSubject.getValue();
    const idx = current.findIndex(t => t.id === tarea.id);
    if (idx >= 0) {
      const updated = [...current];
      updated[idx] = tarea;
      this.tareasSubject.next(updated);
    }
  }

  getTareasSnapshot(): Tarea[] {
    return this.tareasSubject.getValue();
  }

  // ── Detalle de una tarea completada (para historial en mini-diagrama) ─────────
  // Consolida la lógica que antes estaba en TaskDetailService.

  /**
   * GET /api/tasks/{taskId}/detail
   * Mapea TaskResponse del backend al contrato TaskDetailResponse que
   * usa TareaHistorialDialogComponent para mostrar el historial de un nodo.
   */
  getDetallePorId(taskId: string): Observable<TaskDetailResponse> {
    /** Forma de la respuesta del backend GET /tasks/{id}/detail. */
    interface TaskDetailRaw {
      id: string;
      nodeId: string;
      nodoNombre?: string;
      departamentoNombre?: string;
      departamentoId?: string;
      assignedTo?: string;
      assignedToNombre?: string;
      completedAt?: string;
      formData?: Record<string, unknown>;
    }

    return this.http.get<TaskDetailRaw>(`${this.BASE}/${taskId}/detail`).pipe(
      map(r => ({
        taskId:          r.id,
        nodoId:          r.nodeId,
        etiqueta:        r.nodoNombre         ?? '',
        calleNombre:     r.departamentoNombre ?? null,
        departamentoId:  r.departamentoId     ?? null,
        completadoPor:   r.assignedTo
          ? { userId: r.assignedTo, nombre: r.assignedToNombre ?? r.assignedTo }
          : null,
        completadoEn:    r.completedAt        ?? null,
        formData:        r.formData           ?? {},
        camposDefinicion: [] as CampoDefinicion[],
        archivos:         [],
      } satisfies TaskDetailResponse)),
    );
  }
}
