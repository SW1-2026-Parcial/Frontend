/*
 * MÓDULO: M4 Usuarios
 * CASO DE USO: CU-01 — Formulario de usuario
 * ACTOR: Administrador
 * DESCRIPCIÓN: Formulario reactivo Dumb para crear/editar usuarios
 */

import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Usuario, Rol, ROL_LABELS, CrearUsuarioRequest, ActualizarUsuarioRequest } from '../../../../shared/models/usuario.model';
import { Departamento } from '../../../../shared/models/departamento.model';

/**
 * Formulario de creación/edición de usuarios.
 * Dumb component — solo emite eventos, no llama servicios.
 */
@Component({
  selector: 'app-form-usuario',
  standalone: false,
  templateUrl: './form-usuario.component.html',
  styleUrls: ['./form-usuario.component.scss'],
})
export class FormUsuarioComponent implements OnInit, OnChanges {
  @Input() usuario: Usuario | null = null;
  @Input() departamentos: Departamento[] = [];
  @Input() modoEdicion = false;

  @Output() guardar  = new EventEmitter<CrearUsuarioRequest | ActualizarUsuarioRequest>();
  @Output() cancelar = new EventEmitter<void>();

  form!: FormGroup;

  /** Opciones de rol para el select. */
  readonly rolesOpciones = Object.entries(ROL_LABELS).map(([value, label]) => ({ value, label }));

  /** Opciones de departamento para el select. */
  get deptosOpciones() {
    return [
      { value: null, label: 'Sin departamento' },
      ...this.departamentos.filter((d) => d.activo).map((d) => ({
        value: d.id,
        label: d.nombre,
      })),
    ];
  }

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.inicializarForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['usuario'] && this.form) {
      this.inicializarForm();
    }
  }

  private inicializarForm(): void {
    this.form = this.fb.group({
      nombre:         [this.usuario?.nombre ?? '',         [Validators.required, Validators.minLength(2)]],
      email:          [this.usuario?.email ?? '',          [Validators.required, Validators.email]],
      rol:            [this.usuario?.rol ?? '',            Validators.required],
      departamentoId: [this.usuario?.departamentoId ?? null],
      // Password solo requerido en modo creación — mínimo 8 caracteres
      password:       [
        '',
        this.modoEdicion ? [] : [Validators.required, Validators.minLength(8)],
      ],
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const valor = this.form.value;

    if (this.modoEdicion) {
      // En edición solo se permiten nombre, departamentoId y activo
      this.guardar.emit({
        nombre:         valor.nombre || null,
        departamentoId: valor.departamentoId,
      } as ActualizarUsuarioRequest);
    } else {
      // En creación no se envía activo — el backend lo setea en true por defecto
      const { ...payload } = valor;
      this.guardar.emit(payload as CrearUsuarioRequest);
    }
  }

  errorDe(campo: string): string {
    const ctrl = this.form.get(campo);
    if (!ctrl?.touched || !ctrl.invalid) return '';
    if (ctrl.errors?.['required'])  return 'Este campo es requerido';
    if (ctrl.errors?.['email'])     return 'Ingresa un email válido';
    if (ctrl.errors?.['minlength']) {
      const min = ctrl.errors['minlength'].requiredLength;
      return `Mínimo ${min} caracteres`;
    }
    return 'Campo inválido';
  }

  esInvalido(campo: string): boolean {
    const ctrl = this.form.get(campo);
    return !!(ctrl?.touched && ctrl.invalid);
  }
}
