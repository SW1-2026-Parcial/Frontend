import { NgModule } from '@angular/core';

// PrimeNG modules NOT in SharedModule
import { TabsModule }           from 'primeng/tabs';
import { ProgressBarModule }    from 'primeng/progressbar';

import { SharedModule }        from '../../shared/shared.module';
import { MotorRoutingModule }  from './motor-routing.module';

// Pages
import { BandejaTareasComponent }     from './pages/bandeja-tareas/bandeja-tareas.component';
import { CatalogoPoliticasComponent } from './pages/catalogo-politicas/catalogo-politicas.component';
import { DetallePoliticaComponent }   from './pages/detalle-politica/detalle-politica.component';
import { EjecutarTareaComponent }     from './pages/ejecutar-tarea/ejecutar-tarea.component';

@NgModule({
  declarations: [
    BandejaTareasComponent,
    CatalogoPoliticasComponent,
    DetallePoliticaComponent,
    EjecutarTareaComponent,
  ],
  imports: [
    // SharedModule re-exporta CommonModule, FormsModule, ReactiveFormsModule,
    // y PrimeNG básicos (Table, Button, Dialog, Toast, Tag, Skeleton, etc.)
    SharedModule,
    MotorRoutingModule,
    // Solo módulos PrimeNG que SharedModule NO exporta:
    TabsModule,
    ProgressBarModule,
  ],
})
export class MotorModule {}
