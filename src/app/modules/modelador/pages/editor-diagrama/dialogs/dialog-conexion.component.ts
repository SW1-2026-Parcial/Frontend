/**
 * DialogConexionComponent
 * Dialog dumb para elegir la rama cuando el nodo origen es DECISION.
 * No llama ningún servicio — emite (confirmar) con la rama elegida
 * y deja que EditorDiagramaComponent llame a DiagramaService.conectar().
 */
import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NodoUML } from '../../../../../shared/models/politica.model';

export interface ConexionConfirmada {
  rama: boolean;
}

@Component({
  selector: 'app-dialog-conexion',
  standalone: false,
  template: `
    <p-dialog
      [visible]="visible"
      (visibleChange)="onVisibleChange($event)"
      [modal]="true"
      header="Elegir rama"
      [style]="{ width: '380px' }"
      [closable]="false"
      styleClass="sp1-dialog"
    >
      <div *ngIf="conexionPendiente" class="conn-dialog">
        <p class="conn-dialog__route">
          <strong>{{ conexionPendiente.origen.etiqueta }}</strong>
          <i class="pi pi-arrow-right" style="font-size:12px;color:#94a3b8"></i>
          <strong>{{ conexionPendiente.destino.etiqueta }}</strong>
        </p>
        <form [formGroup]="form" novalidate>
          <div class="panel-field">
            <label class="label-field">Rama <span class="text-danger">*</span></label>
            <p-select
              formControlName="rama"
              [options]="ramasDecision"
              optionLabel="label"
              optionValue="value"
              styleClass="w-full"
              appendTo="body"
            ></p-select>
            <small class="form-hint">false = principal · true = alternativa</small>
          </div>
        </form>
      </div>

      <ng-template pTemplate="footer">
        <button pButton pRipple type="button"
          label="Cancelar" icon="pi pi-times"
          class="p-button-text p-button-secondary"
          (click)="onCancelar()">
        </button>
        <button pButton pRipple type="button"
          label="Conectar" icon="pi pi-check"
          class="p-button-primary"
          [loading]="loading"
          (click)="onConfirmar()">
        </button>
      </ng-template>
    </p-dialog>
  `,
})
export class DialogConexionComponent implements OnChanges {

  @Input() visible = false;
  @Input() conexionPendiente: { origen: NodoUML; destino: NodoUML } | null = null;
  @Input() loading = false;

  @Output() confirmar = new EventEmitter<ConexionConfirmada>();
  @Output() cancelar  = new EventEmitter<void>();

  readonly ramasDecision = [
    { label: 'Principal (éxito)',     value: false },
    { label: 'Alternativa (rechazo)', value: true  },
  ];

  form!: FormGroup;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({ rama: [false, Validators.required] });
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Resetear el form al abrir el dialog
    if (changes['visible']?.currentValue === true) {
      this.form.reset({ rama: false });
    }
  }

  onVisibleChange(isVisible: boolean): void {
    this.visible = isVisible;
    if (!isVisible) this.cancelar.emit();
  }

  onConfirmar(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.confirmar.emit({ rama: this.form.value.rama });
  }

  onCancelar(): void {
    this.cancelar.emit();
  }
}
