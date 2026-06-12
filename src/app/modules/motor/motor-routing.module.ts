import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { BandejaTareasComponent }     from './pages/bandeja-tareas/bandeja-tareas.component';
import { CatalogoPoliticasComponent } from './pages/catalogo-politicas/catalogo-politicas.component';
import { DetallePoliticaComponent }   from './pages/detalle-politica/detalle-politica.component';
import { EjecutarTareaComponent }     from './pages/ejecutar-tarea/ejecutar-tarea.component';

const routes: Routes = [
  { path: '',               component: BandejaTareasComponent },
  { path: 'politicas',      component: CatalogoPoliticasComponent },
  { path: 'politicas/:id',  component: DetallePoliticaComponent },
  { path: 'tareas/:id',     component: EjecutarTareaComponent },
  { path: '**',             redirectTo: '' },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MotorRoutingModule {}
