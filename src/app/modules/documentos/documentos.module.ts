import { NgModule } from '@angular/core';

// PrimeNG modules NOT in SharedModule
import { FileUploadModule } from 'primeng/fileupload';
import { TreeModule } from 'primeng/tree';
import { ProgressBarModule } from 'primeng/progressbar';
import { SelectButtonModule } from 'primeng/selectbutton';
import { ToolbarModule } from 'primeng/toolbar';
import { TimelineModule } from 'primeng/timeline';
import { CardModule } from 'primeng/card';

import { SharedModule } from '../../shared/shared.module';
import { DocumentosRoutingModule } from './documentos-routing.module';

// Páginas
import { RepositorioComponent } from './pages/repositorio/repositorio.component';
import { EditorColaborativoComponent } from './pages/editor-colaborativo/editor-colaborativo.component';

// Componentes
import { UploadDialogComponent } from './components/upload-dialog/upload-dialog.component';
import { DocumentoCardComponent } from './components/documento-card/documento-card.component';
import { PermisosPanelComponent } from './components/permisos-panel/permisos-panel.component';
import { DocumentoDetalleComponent } from './components/documento-detalle/documento-detalle.component';

// PrimeNG extra
import { TabsModule } from 'primeng/tabs';
import { DrawerModule } from 'primeng/drawer';

@NgModule({
  declarations: [
    RepositorioComponent,
    EditorColaborativoComponent,
    UploadDialogComponent,
    DocumentoCardComponent,
    PermisosPanelComponent,
    DocumentoDetalleComponent,
  ],
  imports: [
    // SharedModule re-exporta CommonModule, FormsModule, ReactiveFormsModule,
    // y PrimeNG básicos (Table, Button, Dialog, Toast, ConfirmDialog, Tag, etc.)
    SharedModule,
    DocumentosRoutingModule,
    // Solo módulos PrimeNG que SharedModule NO exporta:
    FileUploadModule,
    TreeModule,
    ProgressBarModule,
    SelectButtonModule,
    ToolbarModule,
    TimelineModule,
    CardModule,
    TabsModule,
    DrawerModule,
  ],
})
export class DocumentosModule {}
