import { NgModule } from '@angular/core';

// PrimeNG modules NOT in SharedModule — only import what SharedModule doesn't export
import { TimelineModule }        from 'primeng/timeline';
import { ChartModule }           from 'primeng/chart';
import { TabsModule }            from 'primeng/tabs';
import { ToggleButtonModule }    from 'primeng/togglebutton';
import { ProgressBarModule }     from 'primeng/progressbar';

import { SharedModule }              from '../../shared/shared.module';
import { SupervisorRoutingModule }   from './supervisor-routing.module';
import { MetricasService }           from './services/metricas.service';

// Pages
import { DashboardTramitesComponent } from './pages/dashboard-tramites/dashboard-tramites.component';
import { HistorialTramiteComponent }  from './pages/historial-tramite/historial-tramite.component';
import { MetricasComponent }          from './pages/metricas/metricas.component';
import { GestionTareasComponent }     from './pages/gestion-tareas/gestion-tareas.component';
import { AnalisDiagramaComponent }    from './pages/analisis-diagrama/analisis-diagrama.component';
import { MiraDashboardComponent }     from './pages/mira-dashboard/mira-dashboard.component';

// Components
import { CanvasReadonlyComponent }    from './components/canvas-readonly/canvas-readonly.component';

@NgModule({
  providers: [
    // Scoped: solo disponible dentro del módulo Supervisor y sus componentes.
    // MonitorService se queda en root porque también lo usa MotorModule (ejecutar-tarea).
    MetricasService,
  ],
  declarations: [
    DashboardTramitesComponent,
    HistorialTramiteComponent,
    MetricasComponent,
    GestionTareasComponent,
    AnalisDiagramaComponent,
    MiraDashboardComponent,
    CanvasReadonlyComponent,
  ],
  imports: [
    // SharedModule re-exporta CommonModule, FormsModule, ReactiveFormsModule,
    // y todos los PrimeNG básicos (Table, Button, Dialog, Toast, Tag, etc.)
    SharedModule,
    SupervisorRoutingModule,
    // Solo módulos PrimeNG que SharedModule NO exporta:
    TimelineModule,
    ChartModule,
    TabsModule,
    ToggleButtonModule,
    ProgressBarModule,
  ],
})
export class SupervisorModule {}
