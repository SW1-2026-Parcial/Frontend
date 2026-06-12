import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Subject, filter, takeUntil } from 'rxjs';
import { AuthService }       from './core/auth/auth.service';
import { RealTimeService }   from './core/services/real-time.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  standalone: false,
  styleUrl: './app.scss',
})
export class App implements OnInit, OnDestroy {
  /** Oculta el layout shell (sidebar+header) en rutas públicas como /auth */
  mostrarShell = false;

  /** Sincroniza padding del contenido y posición del header con el ancho del sidebar */
  sidebarCollapsed = false;

  private destroy$ = new Subject<void>();

  constructor(
    private router:           Router,
    private authService:      AuthService,
    private rt: RealTimeService,
  ) {
    // Inicializar de forma síncrona para evitar doble render del router-outlet
    this.mostrarShell = !this.router.url.startsWith('/auth');

    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => {
        this.mostrarShell = !e.urlAfterRedirects.startsWith('/auth');
      });
  }

  ngOnInit(): void {
    // Conectar/desconectar WebSocket según sesión activa.
    // Cubre tanto login como recarga de página con sesión guardada.
    this.authService.usuarioActual$
      .pipe(takeUntil(this.destroy$))
      .subscribe(usuario => {
        if (usuario) {
          this.rt.connect();
        } else {
          this.rt.disconnect();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
