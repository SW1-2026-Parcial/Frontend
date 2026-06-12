import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AuthGuard } from './core/auth/auth.guard';
import { RoleGuard } from './core/auth/role.guard';

const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () =>
      import('./modules/auth/auth.module').then((m) => m.AuthModule),
  },
  {
    path: 'modelador',
    loadChildren: () =>
      import('./modules/modelador/modelador.module').then((m) => m.ModeladorModule),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['ADMINISTRADOR'] },
  },
  {
    path: 'usuarios',
    loadChildren: () =>
      import('./modules/usuarios/usuarios.module').then((m) => m.UsuariosModule),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['ADMINISTRADOR'] },
  },
  {
    path: 'motor',
    loadChildren: () =>
      import('./modules/motor/motor.module').then((m) => m.MotorModule),
    canActivate: [AuthGuard],
  },
  {
    path: 'supervisor',
    loadChildren: () =>
      import('./modules/supervisor/supervisor.module').then((m) => m.SupervisorModule),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['ADMINISTRADOR', 'SUPERVISOR'] },
  },
  {
    path: 'documentos',
    loadChildren: () =>
      import('./modules/documentos/documentos.module').then((m) => m.DocumentosModule),
    canActivate: [AuthGuard],
  },
  {
    path: 'reportes',
    loadChildren: () =>
      import('./modules/reportes/reportes.module').then((m) => m.ReportesModule),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['ADMINISTRADOR', 'SUPERVISOR'] },
  },
  {
    path: 'trazabilidad',
    redirectTo: '/supervisor',
    pathMatch: 'prefix',
  },
  { path: '', redirectTo: 'auth/login', pathMatch: 'full' },
  { path: '**', redirectTo: 'auth/login' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
