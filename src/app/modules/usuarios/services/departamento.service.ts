/*
 * MÓDULO: M4 Usuarios
 * CASO DE USO: CU-01 — Gestión de Departamentos
 * ACTOR: Administrador
 * DESCRIPCIÓN: Servicio con estado reactivo para CRUD de departamentos
 */

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, finalize, catchError, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  Departamento,
  CrearDepartamentoRequest,
  ActualizarDepartamentoRequest,
} from '../../../shared/models/departamento.model';

/**
 * Servicio de gestión de departamentos.
 * Patrón BehaviorSubject — estado interno privado, Observable público con sufijo $.
 *
 * Endpoints: POST /api/departamentos, GET /api/departamentos, PUT /api/departamentos/{id}, DELETE /api/departamentos/{id}
 * Módulo PUDS: M4 · Caso de uso: CU-01
 */
@Injectable({ providedIn: 'root' })
export class DepartamentoService {
  private readonly BASE = `${environment.apiUrl}/departamentos`;

  // Estado interno
  private departamentosSubject = new BehaviorSubject<Departamento[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);

  // Observables públicos — los componentes solo leen
  departamentos$ = this.departamentosSubject.asObservable();
  loading$ = this.loadingSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Carga todos los departamentos desde el backend y actualiza el estado.
   */
  cargarDepartamentos(): void {
    this.loadingSubject.next(true);
    this.http
      .get<Departamento[]>(this.BASE)
      .pipe(finalize(() => this.loadingSubject.next(false)))
      .subscribe({
        next: (lista) => this.departamentosSubject.next(lista),
        error: (err) => console.error('[DepartamentoService] Error al cargar:', err),
      });
  }

  /**
   * Crea un nuevo departamento.
   * @param datos - Payload de creación
   * @returns Observable con el departamento creado
   */
  crear(datos: CrearDepartamentoRequest): Observable<Departamento> {
    return this.http
      .post<Departamento>(this.BASE, datos)
      .pipe(catchError((err) => throwError(() => err)));
  }

  /**
   * Actualiza los datos de un departamento existente.
   * Mismo schema que POST, todos los campos opcionales.
   * @param id    - ID del departamento
   * @param datos - Campos a actualizar
   */
  actualizar(id: string, datos: ActualizarDepartamentoRequest): Observable<Departamento> {
    return this.http
      .put<Departamento>(`${this.BASE}/${id}`, datos)
      .pipe(catchError((err) => throwError(() => err)));
  }

  /**
   * Soft delete — setea activo=false. Retorna 204 sin body.
   * @param id - ID del departamento
   */
  eliminar(id: string): Observable<void> {
    return this.http
      .delete<void>(`${this.BASE}/${id}`)
      .pipe(catchError((err) => throwError(() => err)));
  }

  /** Retorna el snapshot actual sin suscripción — útil para selects. */
  getDepartamentosSnapshot(): Departamento[] {
    return this.departamentosSubject.getValue();
  }
}
