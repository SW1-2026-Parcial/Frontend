import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

// PrimeNG
import { TableModule }          from 'primeng/table';
import { ButtonModule }         from 'primeng/button';
import { DialogModule }         from 'primeng/dialog';
import { InputTextModule }      from 'primeng/inputtext';
import { ToastModule }          from 'primeng/toast';
import { ConfirmDialogModule }  from 'primeng/confirmdialog';
import { SkeletonModule }       from 'primeng/skeleton';
import { TooltipModule }        from 'primeng/tooltip';
import { TagModule }            from 'primeng/tag';
import { BadgeModule }          from 'primeng/badge';
import { RippleModule }         from 'primeng/ripple';
import { ToggleSwitchModule }   from 'primeng/toggleswitch';
import { TextareaModule }       from 'primeng/textarea';
import { SelectModule }         from 'primeng/select';
import { MessageModule }        from 'primeng/message';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { DividerModule }        from 'primeng/divider';
import { ChipModule }           from 'primeng/chip';
import { MenuModule }           from 'primeng/menu';
import { AvatarModule }         from 'primeng/avatar';
import { PasswordModule }       from 'primeng/password';
import { IconFieldModule }      from 'primeng/iconfield';
import { InputIconModule }      from 'primeng/inputicon';
import { FloatLabelModule }     from 'primeng/floatlabel';
import { CheckboxModule }       from 'primeng/checkbox';
import { RadioButtonModule }    from 'primeng/radiobutton';
import { InputNumberModule }    from 'primeng/inputnumber';

// Componentes propios
import { Sp1BadgeComponent }           from './components/sp1-badge/sp1-badge.component';
import { Sp1TableComponent }           from './components/sp1-table/sp1-table.component';
import { Sp1DialogComponent }          from './components/sp1-dialog/sp1-dialog.component';
import { Sp1EmptyStateComponent }      from './components/sp1-empty-state/sp1-empty-state.component';
import { FormularioDinamicoComponent }    from './components/formulario-dinamico/formulario-dinamico.component';
import { TareaHistorialDialogComponent } from './components/tarea-historial-dialog/tarea-historial-dialog.component';
import { MiniDiagramaComponent }        from './components/mini-diagrama/mini-diagrama.component';

// Pipes
import { EstadoPipe }           from './pipes/estado.pipe';
import { ReporteMarkdownPipe }  from './pipes/reporte-markdown.pipe';

// Directives
import { SortablejsDirective } from './directives/sortablejs.directive';

const PRIME_MODULES = [
  TableModule, ButtonModule, DialogModule, InputTextModule,
  ToastModule, ConfirmDialogModule, SkeletonModule, TooltipModule, TagModule,
  BadgeModule, RippleModule, ToggleSwitchModule, TextareaModule, SelectModule,
  MessageModule, ProgressSpinnerModule, DividerModule, ChipModule, MenuModule,
  AvatarModule, PasswordModule, IconFieldModule, InputIconModule, FloatLabelModule,
  CheckboxModule, RadioButtonModule, InputNumberModule,
];

const SP1_COMPONENTS = [
  Sp1BadgeComponent,
  Sp1TableComponent,
  Sp1DialogComponent,
  Sp1EmptyStateComponent,
  FormularioDinamicoComponent,
  TareaHistorialDialogComponent,
  MiniDiagramaComponent,
];

const SP1_PIPES = [
  EstadoPipe,
  ReporteMarkdownPipe,
];

const SP1_DIRECTIVES = [
  SortablejsDirective,
];

@NgModule({
  declarations: [...SP1_COMPONENTS, ...SP1_PIPES, ...SP1_DIRECTIVES],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    ...PRIME_MODULES,
  ],
  exports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    ...PRIME_MODULES,
    ...SP1_COMPONENTS,
    ...SP1_PIPES,
    ...SP1_DIRECTIVES,
  ],
})
export class SharedModule {}
