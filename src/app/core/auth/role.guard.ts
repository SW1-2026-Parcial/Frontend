import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router, UrlTree } from '@angular/router';
import { AuthService } from './auth.service';
import { Rol } from '../../shared/models/usuario.model';

/** Verifica rol del usuario contra data.roles de la ruta. */
@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): boolean | UrlTree {
    const roles = route.data['roles'] as Rol[] | undefined;
    if (!roles?.length || this.authService.tieneRol(roles)) return true;
    return this.router.createUrlTree([this.authService.getRutaInicial()]);
  }
}
