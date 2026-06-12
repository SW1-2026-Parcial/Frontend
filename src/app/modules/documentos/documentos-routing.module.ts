import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { RepositorioComponent } from './pages/repositorio/repositorio.component';
import { EditorColaborativoComponent } from './pages/editor-colaborativo/editor-colaborativo.component';

const routes: Routes = [
  { path: '', component: RepositorioComponent },
  { path: 'editor/:documentoId', component: EditorColaborativoComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DocumentosRoutingModule {}
