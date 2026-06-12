import { Component, Input } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { MenuItem } from 'primeng/api';
import { AuthService } from '../../core/auth/auth.service';

interface BreadcrumbItem { label: string; route?: string; }

const ROUTE_LABELS: Record<string, string> = {
  modelador:          'Modelador de Políticas',
  'lista-politicas':  'Políticas',
  'editor-diagrama':  'Editor de Diagrama',
  motor:              'Motor de Trámites',
  supervisor:         'Supervisión',
  trazabilidad:       'Trazabilidad',
  usuarios:           'Gestión de Usuarios',
  departamentos:      'Departamentos',
  documentos:         'Documentos',
  reportes:           'Reportes',
  metricas:           'Métricas',
  tareas:             'Tareas',
  'analisis-inteligente': 'Análisis Inteligente',
};

@Component({
  selector: 'app-header',
  standalone: false,
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent {
  @Input() sidebarCollapsed = false;

  breadcrumb: BreadcrumbItem[] = [];

  menuUsuario: MenuItem[] = [
    { label: 'Mi perfil',    icon: 'pi pi-user' },
    { separator: true },
    {
      label: 'Cerrar sesión',
      icon: 'pi pi-sign-out',
      command: () => this.authService.logout(),
    },
  ];

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(() => {
        this.breadcrumb = this.generarBreadcrumb();
      });

    this.breadcrumb = this.generarBreadcrumb();
  }

  get usuario$() { return this.authService.usuarioActual$; }

  get iniciales(): string {
    const u = this.authService.getUsuarioActual();
    return u ? u.nombre.slice(0, 2).toUpperCase() : '?';
  }

  private generarBreadcrumb(): BreadcrumbItem[] {
    const url = this.router.url.split('?')[0];
    const segmentos = url.split('/').filter(Boolean);

    const items: BreadcrumbItem[] = [{ label: 'Gaara', route: '/' }];

    let rutaAcumulada = '';
    for (const seg of segmentos) {
      rutaAcumulada += `/${seg}`;
      const label = ROUTE_LABELS[seg] ?? seg;
      items.push({ label, route: rutaAcumulada });
    }

    return items;
  }
}
