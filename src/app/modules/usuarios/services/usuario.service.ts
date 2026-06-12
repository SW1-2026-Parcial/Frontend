/*
 * MÓDULO: M4 Usuarios
 * CASO DE USO: CU-01 — Gestión de Usuarios
 * ACTOR: Administrador
 * DESCRIPCIÓN: Servicio con estado reactivo para CRUD de usuarios
 */

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, finalize, catchError, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  Usuario,
  CrearUsuarioRequest,
  ActualizarUsuarioRequest,
} from '../../../shared/models/usuario.model';

/**
 * Servicio de gestión de usuarios del sistema sp1.
 * Patrón BehaviorSubject — instancia singleton gracias a providedIn: root.
 *
 * Endpoints: POST /api/users, GET /api/users, PUT /api/users/{id}, DELETE /api/users/{id}
 * Módulo PUDS: M4 · Caso de uso: CU-01
 */
@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private readonly BASE = `${environment.apiUrl}/users`;

  // Estado interno — solo UsuarioService puede escribirlo
  private usuariosSubject = new BehaviorSubject<Usuario[]>([]);
  private loadingSubject  = new BehaviorSubject<boolean>(false);
  private totalSubject    = new BehaviorSubject<number>(0);

  // Observables públicos
  usuarios$ = this.usuariosSubject.asObservable();
  loading$  = this.loadingSubject.asObservable();
  total$    = this.totalSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Carga la lista completa de usuarios y actualiza el estado.
   */
  cargarUsuarios(): void {
    this.loadingSubject.next(true);
    this.http
      .get<Usuario[]>(this.BASE)
      .pipe(finalize(() => this.loadingSubject.next(false)))
      .subscribe({
        next: (lista) => {
          this.usuariosSubject.next(lista);
          this.totalSubject.next(lista.length);
        },
        error: (err) => console.error('[UsuarioService] Error al cargar:', err),
      });
  }

  /**
   * Crea un nuevo usuario en el sistema.
   * @param datos - Payload de creación incluyendo password inicial (min 8 chars)
   * @returns Observable con el usuario creado
   */
  crear(datos: CrearUsuarioRequest): Observable<Usuario> {
    return this.http
      .post<Usuario>(this.BASE, datos)
      .pipe(catchError((err) => throwError(() => err)));
  }

  /**
   * Actualiza los datos de un usuario existente.
   * Campos null = no cambiar. Solo nombre, departamentoId y activo son modificables.
   * @param id    - ID del usuario (ObjectId)
   * @param datos - Campos a modificar
   */
  actualizar(id: string, datos: ActualizarUsuarioRequest): Observable<Usuario> {
    return this.http
      .put<Usuario>(`${this.BASE}/${id}`, datos)
      .pipe(catchError((err) => throwError(() => err)));
  }

  /**
   * Soft delete — setea activo=false en el backend. Retorna 204 sin body.
   * @param id - ID del usuario
   */
  eliminar(id: string): Observable<void> {
    return this.http
      .delete<void>(`${this.BASE}/${id}`)
      .pipe(catchError((err) => throwError(() => err)));
  }

  /**
   * Actualiza un usuario en el estado local sin recargar desde el backend.
   * @param usuarioActualizado - Usuario con datos nuevos
   */
  actualizarEnEstado(usuarioActualizado: Usuario): void {
    const actual = this.usuariosSubject.getValue();
    const idx = actual.findIndex((u) => u.id === usuarioActualizado.id);
    if (idx >= 0) {
      const actualizado = [...actual];
      actualizado[idx] = usuarioActualizado;
      this.usuariosSubject.next(actualizado);
    }
  }

  /**
   * Agrega un nuevo usuario al estado local.
   * @param usuario - Usuario recién creado
   */
  agregarEnEstado(usuario: Usuario): void {
    this.usuariosSubject.next([usuario, ...this.usuariosSubject.getValue()]);
    this.totalSubject.next(this.totalSubject.getValue() + 1);
  }

  /**
   * Elimina un usuario del estado local tras soft delete.
   * @param id - ID del usuario eliminado
   */
  eliminarDeEstado(id: string): void {
    const filtrado = this.usuariosSubject.getValue().filter((u) => u.id !== id);
    this.usuariosSubject.next(filtrado);
    this.totalSubject.next(filtrado.length);
  }
}
