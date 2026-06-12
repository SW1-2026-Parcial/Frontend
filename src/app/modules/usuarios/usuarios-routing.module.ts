/*
 * MÓDULO: M4 Usuarios
 * DESCRIPCIÓN: Rutas del módulo de gestión de usuarios y departamentos
 */

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ListaUsuariosComponent } from './pages/lista-usuarios/lista-usuarios.component';

const routes: Routes = [
  { path: '',     component: ListaUsuariosComponent },
  { path: '**',   redirectTo: '' },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class UsuariosRoutingModule {}
