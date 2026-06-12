/*
 * MÓDULO: M1 Modelador
 * CASO DE USO: CU-02, CU-03, CU-04, CU-05, CU-06
 * ACTOR: Administrador
 * DESCRIPCIÓN: Módulo del modelador visual de políticas de negocio
 */

/*
 * MÓDULO: M1 Modelador
 * CASO DE USO: CU-02, CU-03, CU-04, CU-05, CU-06
 * ACTOR: Administrador
 * DESCRIPCIÓN: Módulo del modelador visual de políticas de negocio
 */

import { NgModule } from '@angular/core';

// PrimeNG modules NOT in SharedModule
import { SelectButtonModule } from 'primeng/selectbutton';

import { SharedModule } from '../../shared/shared.module';
import { ModeladorRoutingModule } from './modelador-routing.module';

// Pages
import { ListaPoliticasComponent } from './pages/lista-politicas/lista-politicas.component';
import { EditorDiagramaComponent } from './pages/editor-diagrama/editor-diagrama.component';

// Sub-componentes del editor (dialogs extraídos)
import { DialogConexionComponent } from './pages/editor-diagrama/dialogs/dialog-conexion.component';
import { DialogCalleComponent }    from './pages/editor-diagrama/dialogs/dialog-calle.component';
import { DialogIAComponent }       from './pages/editor-diagrama/dialogs/dialog-ia.component';

// Components
import { CanvasComponent } from './components/canvas/canvas.component';
import { PanelNodoComponent } from './components/panel-nodo/panel-nodo.component';
import { ToolbarDiagramaComponent } from './components/toolbar-diagrama/toolbar-diagrama.component';

@NgModule({
  declarations: [
    ListaPoliticasComponent,
    EditorDiagramaComponent,
    DialogConexionComponent,
    DialogCalleComponent,
    DialogIAComponent,
    CanvasComponent,
    PanelNodoComponent,
    ToolbarDiagramaComponent,
  ],
  imports: [
    // SharedModule re-exporta CommonModule, FormsModule, ReactiveFormsModule,
    // y PrimeNG básicos (Button, Dialog, Toast, ConfirmDialog, InputText,
    // InputNumber, Select, Checkbox, Tag, Divider, Textarea, Tooltip, etc.)
    SharedModule,
    ModeladorRoutingModule,
    // Solo módulos PrimeNG que SharedModule NO exporta:
    SelectButtonModule,
  ],
})
export class ModeladorModule {}
