import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { DashboardTramitesComponent } from './pages/dashboard-tramites/dashboard-tramites.component';
import { HistorialTramiteComponent }  from './pages/historial-tramite/historial-tramite.component';
import { MetricasComponent }          from './pages/metricas/metricas.component';
import { GestionTareasComponent }     from './pages/gestion-tareas/gestion-tareas.component';
import { AnalisDiagramaComponent }    from './pages/analisis-diagrama/analisis-diagrama.component';
import { MiraDashboardComponent }     from './pages/mira-dashboard/mira-dashboard.component';

const routes: Routes = [
  { path: '',                            component: DashboardTramitesComponent },
  { path: 'tareas',                      component: GestionTareasComponent },
  { path: 'tramites/:id/historial',      component: HistorialTramiteComponent },
  { path: 'metricas',                    component: MetricasComponent },
  { path: 'analisis-diagrama',           component: AnalisDiagramaComponent },
  { path: 'analisis-inteligente',        component: MiraDashboardComponent },
  { path: '**',                          redirectTo: '' },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SupervisorRoutingModule {}
