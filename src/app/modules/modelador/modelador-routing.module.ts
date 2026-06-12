/*
 * MÓDULO: M1 Modelador
 * CASO DE USO: CU-02, CU-03, CU-04, CU-05, CU-06
 * ACTOR: Administrador
 * DESCRIPCIÓN: Rutas del módulo modelador de políticas
 */

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ListaPoliticasComponent } from './pages/lista-politicas/lista-politicas.component';
import { EditorDiagramaComponent } from './pages/editor-diagrama/editor-diagrama.component';

const routes: Routes = [
  {
    path: '',
    component: ListaPoliticasComponent,
  },
  {
    path: 'editor/:id',
    component: EditorDiagramaComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ModeladorRoutingModule {}
