import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { Usuario, Rol } from '../../shared/models/usuario.model';

interface JwtPayload {
  sub: string;
  id: string;
  rol: Rol;
  exp: number;
  iat: number;
}

interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  token: string;
  tipo: string;
  expiresIn: number;
  userId: string;
  email: string;
  rol: Rol;
  nombre: string;
}

const TOKEN_KEY = 'sp1_token';
const USUARIO_KEY = 'sp1_usuario';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private usuarioSubject = new BehaviorSubject<Usuario | null>(this.cargarUsuarioGuardado());
  private loadingSubject = new BehaviorSubject<boolean>(false);

  usuarioActual$ = this.usuarioSubject.asObservable();
  loading$ = this.loadingSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {}

  login(credenciales: LoginRequest): Observable<LoginResponse> {
    this.loadingSubject.next(true);
    return this.http.post<LoginResponse>(`${environment.apiUrl}/auth/login`, credenciales).pipe(
      tap((res) => {
        localStorage.setItem(TOKEN_KEY, res.token);
        const usuario: Usuario = {
          id: res.userId,
          nombre: res.nombre,
          email: res.email,
          rol: res.rol,
          departamentoId: null,
          activo: true,
          creadoPor: res.email,
          creadoEn: new Date().toISOString(),
          actualizadoEn: new Date().toISOString(),
        };
        localStorage.setItem(USUARIO_KEY, JSON.stringify(usuario));
        this.usuarioSubject.next(usuario);
        this.loadingSubject.next(false);
      }),
      catchError((err) => {
        this.loadingSubject.next(false);
        return throwError(() => err);
      }),
    );
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USUARIO_KEY);
    this.usuarioSubject.next(null);
    this.router.navigate(['/auth/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;
    try {
      return this.decodificarToken(token).exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }

  getRol(): Rol | null {
    return this.usuarioSubject.getValue()?.rol ?? null;
  }

  tieneRol(roles: Rol[]): boolean {
    const rol = this.getRol();
    return rol ? roles.includes(rol) : false;
  }

  getUsuarioActual(): Usuario | null {
    return this.usuarioSubject.getValue();
  }

  getRutaInicial(): string {
    switch (this.getRol()) {
      case 'ADMINISTRADOR': return '/modelador';
      case 'SUPERVISOR':    return '/supervisor';
      case 'FUNCIONARIO':   return '/motor';
      default:              return this.isAuthenticated() ? '/modelador' : '/auth/login';
    }
  }

  private cargarUsuarioGuardado(): Usuario | null {
    const raw = localStorage.getItem(USUARIO_KEY);
    if (!raw) return null;
    try { return JSON.parse(raw) as Usuario; }
    catch { return null; }
  }

  /** Decodifica payload JWT sin verificar firma (verificación en backend). */
  private decodificarToken(token: string): JwtPayload {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64)) as JwtPayload;
  }
}
