/**
 * DialogIAComponent
 * Dialog dumb para el asistente IA de generación de diagramas (CU-04).
 * No llama ningún servicio — emite (confirmar) con la instrucción de texto.
 * Acepta un @Input instruccionInicial para pre-cargar la transcripción del micrófono.
 */
import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

export interface IAConfirmada {
  instruccion: string;
}

@Component({
  selector: 'app-dialog-ia',
  standalone: false,
  template: `
    <p-dialog
      [visible]="visible"
      (visibleChange)="onVisibleChange($event)"
      [modal]="true"
      header="Asistente de IA"
      [style]="{ width: '520px', maxWidth: '95vw' }"
      [closable]="!loading"
      [draggable]="false"
      styleClass="sp1-dialog"
    >
      <div class="ia-dialog">

        <div class="ia-dialog__intro">
          <div class="ia-dialog__icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2"
                 stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6L12 2z"/>
            </svg>
          </div>
          <p class="ia-dialog__desc">
            Describe el proceso en lenguaje natural. La IA generará o modificará
            las calles y los nodos del diagrama según la versión actual.
          </p>
        </div>

        <form [formGroup]="form" novalidate class="ia-dialog__form">
          <div class="panel-field">
            <label class="label-field">
              Descripción del proceso <span class="text-danger">*</span>
            </label>
            <textarea
              pInputTextarea
              formControlName="instruccion"
              rows="6"
              style="width: 100%; resize: vertical"
              placeholder="Ej: Flujo de solicitud de instalación de servicio con 3 pasos de validación técnica, aprobación del supervisor y notificación al cliente..."
              [attr.disabled]="loading ? '' : null"
            ></textarea>
            <small
              *ngIf="form.get('instruccion')?.invalid && form.get('instruccion')?.touched"
              class="form-error">
              Mínimo 10 caracteres
            </small>
          </div>

          <p class="ia-dialog__warning">
            <i class="pi pi-info-circle"></i>
            El diagrama actual será reemplazado por el resultado de la IA.
            Asegúrate de que la descripción sea clara y completa.
          </p>
        </form>

      </div>

      <ng-template pTemplate="footer">
        <button pButton pRipple type="button"
          label="Cancelar" icon="pi pi-times"
          class="p-button-text p-button-secondary"
          [disabled]="loading"
          (click)="onCancelar()">
        </button>
        <button pButton pRipple type="button"
          label="Generar diagrama" icon="pi pi-sparkles"
          class="p-button-primary"
          [loading]="loading"
          (click)="onConfirmar()">
        </button>
      </ng-template>
    </p-dialog>
  `,
})
export class DialogIAComponent implements OnChanges {

  @Input() visible            = false;
  @Input() loading            = false;
  /** Texto pre-cargado desde el micrófono. El padre lo pasa antes de abrir. */
  @Input() instruccionInicial = '';

  @Output() confirmar = new EventEmitter<IAConfirmada>();
  @Output() cancelar  = new EventEmitter<void>();

  form!: FormGroup;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      instruccion: ['', [Validators.required, Validators.minLength(10)]],
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible']?.currentValue === true) {
      // Al abrir: pre-cargar instrucción inicial (puede venir del micrófono o estar vacía)
      this.form.reset({ instruccion: this.instruccionInicial });
    }
    if (changes['instruccionInicial'] && this.visible) {
      // Si el padre actualiza el texto mientras el dialog ya está abierto
      this.form.patchValue({ instruccion: this.instruccionInicial });
    }
  }

  onVisibleChange(isVisible: boolean): void {
    this.visible = isVisible;
    if (!isVisible) this.cancelar.emit();
  }

  onConfirmar(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.confirmar.emit({ instruccion: this.form.value.instruccion.trim() });
  }

  onCancelar(): void {
    this.cancelar.emit();
  }
}
