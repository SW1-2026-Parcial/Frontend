import { Component, OnInit, OnDestroy, Output, EventEmitter, Input } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Subject, filter, takeUntil } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { Usuario, Rol, ROL_LABELS } from '../../shared/models/usuario.model';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  roles: Rol[];
  badge?: number;
  exact?: boolean;
}

interface NavSection {
  title: string;
  items: NavItem[];
  roles: Rol[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Administración',
    roles: ['ADMINISTRADOR'],
    items: [
      { label: 'Políticas',   icon: 'pi pi-sitemap',    route: '/modelador',  roles: ['ADMINISTRADOR'] },
      { label: 'Usuarios',    icon: 'pi pi-users',      route: '/usuarios',   roles: ['ADMINISTRADOR'] },
    ],
  },
  {
    title: 'Operaciones',
    roles: ['ADMINISTRADOR', 'SUPERVISOR', 'FUNCIONARIO'],
    items: [
      { label: 'Bandeja',    icon: 'pi pi-inbox',       route: '/motor',      roles: ['ADMINISTRADOR', 'SUPERVISOR', 'FUNCIONARIO'] },
    ],
  },
  {
    title: 'Documentos',
    roles: ['ADMINISTRADOR', 'SUPERVISOR', 'FUNCIONARIO'],
    items: [
      { label: 'Repositorio', icon: 'pi pi-folder-open',  route: '/documentos',  roles: ['ADMINISTRADOR', 'SUPERVISOR', 'FUNCIONARIO'] },
    ],
  },
  {
    title: 'Supervisión',
    roles: ['ADMINISTRADOR', 'SUPERVISOR'],
    items: [
      { label: 'Monitor',    icon: 'pi pi-desktop',      route: '/supervisor',               roles: ['ADMINISTRADOR', 'SUPERVISOR'], exact: true },
      { label: 'Tareas',     icon: 'pi pi-list-check',   route: '/supervisor/tareas',        roles: ['ADMINISTRADOR', 'SUPERVISOR'], exact: true },
      { label: 'Métricas',   icon: 'pi pi-chart-bar',    route: '/supervisor/metricas',      roles: ['ADMINISTRADOR', 'SUPERVISOR'], exact: true },
      { label: 'Análisis Inteligente', icon: 'pi pi-bolt', route: '/supervisor/analisis-inteligente', roles: ['ADMINISTRADOR', 'SUPERVISOR'], exact: true },
    ],
  },
  {
    title: 'Reportes',
    roles: ['ADMINISTRADOR', 'SUPERVISOR'],
    items: [
      { label: 'Generar Reporte', icon: 'pi pi-file-export', route: '/reportes',             roles: ['ADMINISTRADOR', 'SUPERVISOR'] },
    ],
  },
];

@Component({
  selector: 'app-sidebar',
  standalone: false,
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
})
export class SidebarComponent implements OnInit, OnDestroy {
  @Input() collapsed = false;
  @Output() collapseChange = new EventEmitter<boolean>();

  usuario: Usuario | null = null;
  rutaActiva = '';
  seccionesVisibles: NavSection[] = [];

  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.authService.usuarioActual$
      .pipe(takeUntil(this.destroy$))
      .subscribe(usuario => {
        this.usuario = usuario;
        this.seccionesVisibles = this.filtrarPorRol(usuario?.rol ?? null);
      });

    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd), takeUntil(this.destroy$))
      .subscribe(e => this.rutaActiva = e.urlAfterRedirects);

    this.rutaActiva = this.router.url;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /** Solo emite — padre es fuente de verdad → un CD cycle → transitions sincronizadas. */
  toggleCollapse(): void {
    this.collapseChange.emit(!this.collapsed);
  }

  esRutaActiva(item: NavItem): boolean {
    return item.exact
      ? this.rutaActiva === item.route
      : this.rutaActiva === item.route || this.rutaActiva.startsWith(item.route + '/');
  }

  private filtrarPorRol(rol: Rol | null): NavSection[] {
    if (!rol) return [];
    return NAV_SECTIONS
      .filter((s) => s.roles.includes(rol))
      .map((s) => ({
        ...s,
        items: s.items.filter((item) => item.roles.includes(rol)),
      }));
  }

  get iniciales(): string {
    return this.usuario ? this.usuario.nombre.slice(0, 2).toUpperCase() : '?';
  }

  rolLabel(rol: Rol): string { return ROL_LABELS[rol] ?? rol; }

  logout(): void { this.authService.logout(); }
}
