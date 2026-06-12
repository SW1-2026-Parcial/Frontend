/*
 * MÓDULO: M4 Auth
 * DESCRIPCIÓN: Módulo de autenticación — Login. No importa SharedModule (es ligero).
 */

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

// PrimeNG mínimo para el login
import { ButtonModule }    from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule }     from 'primeng/toast';
import { RippleModule }    from 'primeng/ripple';
import { MessageService }  from 'primeng/api';

import { AuthRoutingModule } from './auth-routing.module';
import { LoginComponent }    from './pages/login/login.component';

@NgModule({
  declarations: [LoginComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AuthRoutingModule,
    ButtonModule,
    InputTextModule,
    ToastModule,
    RippleModule,
  ],
  providers: [MessageService],
})
export class AuthModule {}
