import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GenerarReporteComponent } from './pages/generar-reporte/generar-reporte.component';

const routes: Routes = [
  { path: '', component: GenerarReporteComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ReportesRoutingModule {}
