/*
 * MÓDULO: M4 Usuarios
 * CASO DE USO: CU-01 — Formulario de departamento
 * ACTOR: Administrador
 * DESCRIPCIÓN: Formulario reactivo Dumb para crear/editar departamentos
 */

import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Departamento, CrearDepartamentoRequest, ActualizarDepartamentoRequest } from '../../../../shared/models/departamento.model';

@Component({
  selector: 'app-form-departamento',
  standalone: false,
  templateUrl: './form-departamento.component.html',
  styleUrls: ['./form-departamento.component.scss'],
})
export class FormDepartamentoComponent implements OnInit, OnChanges {
  @Input() departamento: Departamento | null = null;
  @Input() modoEdicion = false;

  @Output() guardar  = new EventEmitter<CrearDepartamentoRequest | ActualizarDepartamentoRequest>();
  @Output() cancelar = new EventEmitter<void>();

  form!: FormGroup;

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void { this.inicializarForm(); }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['departamento'] && this.form) this.inicializarForm();
  }

  private inicializarForm(): void {
    this.form = this.fb.group({
      nombre:      [this.departamento?.nombre ?? '',      [Validators.required, Validators.minLength(3)]],
      descripcion: [this.departamento?.descripcion ?? '', Validators.required],
    });
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.guardar.emit(this.form.value);
  }

  errorDe(campo: string): string {
    const ctrl = this.form.get(campo);
    if (!ctrl?.touched || !ctrl.invalid) return '';
    if (ctrl.errors?.['required'])  return 'Este campo es requerido';
    if (ctrl.errors?.['minlength']) return `Mínimo ${ctrl.errors['minlength'].requiredLength} caracteres`;
    return 'Campo inválido';
  }

  esInvalido(campo: string): boolean {
    const ctrl = this.form.get(campo);
    return !!(ctrl?.touched && ctrl.invalid);
  }
}
