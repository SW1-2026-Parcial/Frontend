/*
 * MÓDULO: M4 Usuarios
 * DESCRIPCIÓN: Módulo de gestión de usuarios y departamentos — CU-01
 */

import { NgModule } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { TabsModule } from 'primeng/tabs';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { PasswordModule } from 'primeng/password';

import { UsuariosRoutingModule }      from './usuarios-routing.module';
import { ListaUsuariosComponent }     from './pages/lista-usuarios/lista-usuarios.component';
import { FormUsuarioComponent }       from './components/form-usuario/form-usuario.component';
import { FormDepartamentoComponent }  from './components/form-departamento/form-departamento.component';

@NgModule({
  declarations: [
    ListaUsuariosComponent,
    FormUsuarioComponent,
    FormDepartamentoComponent,
  ],
  imports: [
    SharedModule,
    UsuariosRoutingModule,
    TabsModule,
    ConfirmDialogModule,
    PasswordModule,
  ],
})
export class UsuariosModule {}
