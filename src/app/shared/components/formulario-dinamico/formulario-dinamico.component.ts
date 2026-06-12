import {
  Component, Input, OnChanges, SimpleChanges,
} from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { CampoDefinicion } from '../../models/politica.model';

@Component({
  selector: 'app-formulario-dinamico',
  standalone: false,
  templateUrl: './formulario-dinamico.component.html',
  styleUrls: ['./formulario-dinamico.component.scss'],
})
export class FormularioDinamicoComponent implements OnChanges {

  @Input() campos: CampoDefinicion[] = [];
  @Input() form!: FormGroup;
  @Input() readonly = false;

  /** Mapa campo.nombre → File real seleccionado. Usado por EjecutarTareaComponent al subir. */
  archivosSeleccionados: Map<string, File> = new Map();

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['campos'] && this.form) {
      this.sincronizarControles();
    }
  }

  private sincronizarControles(): void {
    Object.keys(this.form.controls).forEach(key => {
      if (!this.campos.find(c => c.nombre === key)) {
        this.form.removeControl(key);
      }
    });
    for (const campo of this.campos) {
      if (!this.form.contains(campo.nombre)) {
        this.form.addControl(
          campo.nombre,
          new FormControl(null, campo.requerido ? Validators.required : []),
        );
      }
    }
  }

  esInvalido(nombre: string): boolean {
    const ctrl = this.form.get(nombre);
    return !!(ctrl?.invalid && ctrl.touched);
  }

  opcionesSelect(campo: CampoDefinicion): { label: string; value: string }[] {
    return (campo.opciones ?? []).map(o => ({ label: o, value: o }));
  }

  /**
   * Guarda el File real en archivosSeleccionados y el nombre en el FormControl.
   * EjecutarTareaComponent lee archivosSeleccionados para subir a Azure antes de completar.
   */
  onFileChange(event: Event, nombre: string): void {
    const input = event.target as HTMLInputElement;
    const file  = input.files?.[0];
    const ctrl  = this.form.get(nombre);
    if (!ctrl) return;

    if (file) {
      this.archivosSeleccionados.set(nombre, file);
      ctrl.setValue(file.name);
    } else {
      this.archivosSeleccionados.delete(nombre);
      ctrl.setValue(null);
    }
    ctrl.markAsTouched();
  }
}
