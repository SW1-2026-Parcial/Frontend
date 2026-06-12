import { NgModule } from '@angular/core';

// PrimeNG modules NOT in SharedModule
import { CardModule } from 'primeng/card';
import { ProgressBarModule } from 'primeng/progressbar';

import { SharedModule } from '../../shared/shared.module';
import { ReportesRoutingModule } from './reportes-routing.module';
import { GenerarReporteComponent } from './pages/generar-reporte/generar-reporte.component';

@NgModule({
  declarations: [GenerarReporteComponent],
  imports: [
    // SharedModule re-exporta CommonModule, FormsModule, ReactiveFormsModule,
    // y PrimeNG básicos (Button, InputText, Textarea, Select, Tag, Divider, Toast, Chip, etc.)
    SharedModule,
    ReportesRoutingModule,
    // Solo módulos PrimeNG que SharedModule NO exporta:
    CardModule,
    ProgressBarModule,
  ],
})
export class ReportesModule {}
