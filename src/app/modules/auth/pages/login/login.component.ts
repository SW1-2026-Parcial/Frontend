/*
 * MÓDULO: M4 Auth
 * CASO DE USO: CU-Login — Autenticación de usuarios
 * ACTOR: Todos los roles
 * DESCRIPCIÓN: Página de login empresarial con formulario reactivo y validación
 */

import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../../../core/auth/auth.service';

/**
 * Componente Smart de la página de login.
 * Maneja el formulario reactivo de autenticación y redirige según el rol tras el login exitoso.
 *
 * Módulo PUDS: M4 Auth · Caso de uso: CU-Login
 */
@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  providers: [MessageService],
})
export class LoginComponent implements OnInit {
  form!: FormGroup;
  loading = false;
  mostrarPassword = false;
  errorMensaje = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private messageService: MessageService,
  ) {}

  ngOnInit(): void {
    // Si ya hay sesión activa, redirige directamente
    if (this.authService.isAuthenticated()) {
      this.router.navigate([this.authService.getRutaInicial()]);
      return;
    }

    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  /**
   * Envía las credenciales al backend.
   * Si es exitoso, redirige a la ruta inicial del rol.
   */
  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMensaje = '';

    this.authService.login(this.form.value).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate([this.authService.getRutaInicial()]);
      },
      error: (err) => {
        this.loading = false;
        this.errorMensaje = err.status === 401
          ? 'Credenciales incorrectas. Verifica tu email y contraseña.'
          : 'Error de conexión. Intenta nuevamente.';
      },
    });
  }

  /** Alterna la visibilidad del campo de contraseña. */
  togglePassword(): void {
    this.mostrarPassword = !this.mostrarPassword;
  }

  // ---- Helpers de validación para el template ----

  get emailInvalido(): boolean {
    const ctrl = this.form.get('email');
    return !!(ctrl?.invalid && ctrl.touched);
  }

  get passwordInvalido(): boolean {
    const ctrl = this.form.get('password');
    return !!(ctrl?.invalid && ctrl.touched);
  }

  get emailError(): string {
    const ctrl = this.form.get('email');
    if (ctrl?.errors?.['required']) return 'El email es requerido';
    if (ctrl?.errors?.['email'])    return 'Ingresa un email válido';
    return '';
  }

  get passwordError(): string {
    const ctrl = this.form.get('password');
    if (ctrl?.errors?.['required'])   return 'La contraseña es requerida';
    if (ctrl?.errors?.['minlength'])  return 'La contraseña debe tener al menos 6 caracteres';
    return '';
  }
}
