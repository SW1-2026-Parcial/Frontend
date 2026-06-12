/**
 * DialogCalleComponent
 * Dialog dumb para crear o editar un swim lane (Calle).
 * No llama ningún servicio — emite (confirmar) con nombre + departamentoId
 * y deja que EditorDiagramaComponent llame a DiagramaService.crearCalle()
 * o DiagramaService.actualizarCalle().
 */
import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Calle } from '../../../../../shared/models/politica.model';

export interface CalleConfirmada {
  nombre:         string;
  departamentoId: string | null;
}

@Component({
  selector: 'app-dialog-calle',
  standalone: false,
  template: `
    <p-dialog
      [visible]="visible"
      (visibleChange)="onVisibleChange($event)"
      [modal]="true"
      [header]="calleEditando ? 'Editar swim lane' : 'Agregar swim lane'"
      [style]="{ width: '380px' }"
      styleClass="sp1-dialog"
    >
      <form [formGroup]="form" novalidate class="calle-form">
        <div class="panel-field">
          <label class="label-field">Nombre <span class="text-danger">*</span></label>
          <input pInputText formControlName="nombre"
            style="width:100%" placeholder="Ej: Área Técnica"/>
          <small
            *ngIf="form.get('nombre')?.invalid && form.get('nombre')?.touched"
            class="form-error">
            El nombre es obligatorio
          </small>
        </div>
        <div class="panel-field">
          <label class="label-field">Departamento responsable</label>
          <p-select
            formControlName="departamentoId"
            [options]="departamentosOpciones"
            optionLabel="label"
            optionValue="value"
            placeholder="Sin asignar"
            styleClass="w-full"
            appendTo="body"
          ></p-select>
        </div>
      </form>

      <ng-template pTemplate="footer">
        <button pButton pRipple type="button"
          label="Cancelar" icon="pi pi-times"
          class="p-button-text p-button-secondary"
          (click)="onCancelar()">
        </button>
        <button pButton pRipple type="button"
          [label]="calleEditando ? 'Guardar cambios' : 'Agregar'"
          [icon]="calleEditando ? 'pi pi-check' : 'pi pi-plus'"
          class="p-button-primary"
          [loading]="loading"
          (click)="onConfirmar()">
        </button>
      </ng-template>
    </p-dialog>
  `,
})
export class DialogCalleComponent implements OnChanges {

  @Input() visible     = false;
  @Input() calleEditando: Calle | null = null;
  @Input() departamentosOpciones: { label: string; value: string | null }[] = [];
  @Input() loading     = false;

  @Output() confirmar  = new EventEmitter<CalleConfirmada>();
  @Output() cancelar   = new EventEmitter<void>();

  form!: FormGroup;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      nombre:         ['', Validators.required],
      departamentoId: [null],
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Sincronizar el form con los datos de la calle que se está editando
    if (changes['visible']?.currentValue === true) {
      if (this.calleEditando) {
        this.form.reset({
          nombre:         this.calleEditando.nombre,
          departamentoId: this.calleEditando.departamentoId ?? null,
        });
      } else {
        this.form.reset({ nombre: '', departamentoId: null });
      }
    }
    // Actualizar nombre por defecto si el padre lo cambia antes de abrir
    if (changes['calleEditando'] && !this.calleEditando) {
      this.form.reset({ nombre: '', departamentoId: null });
    }
  }

  onVisibleChange(isVisible: boolean): void {
    this.visible = isVisible;
    if (!isVisible) this.cancelar.emit();
  }

  /** Permite al padre pre-setear el nombre por defecto (ej: "Calle 3") */
  setNombreDefault(nombre: string): void {
    if (!this.calleEditando) {
      this.form.patchValue({ nombre });
    }
  }

  onConfirmar(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const { nombre, departamentoId } = this.form.value;
    this.confirmar.emit({ nombre, departamentoId: departamentoId ?? null });
  }

  onCancelar(): void {
    this.cancelar.emit();
  }
}
