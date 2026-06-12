import { Component, Input, Output, EventEmitter } from '@angular/core';

export type DialogSize = 'sm' | 'md' | 'lg' | 'xl';
export type DialogType = 'default' | 'danger';

const SIZE_MAP: Record<DialogSize, string> = { sm: '420px', md: '620px', lg: '900px', xl: '1100px' };

@Component({
  selector: 'app-sp1-dialog',
  standalone: false,
  templateUrl: './sp1-dialog.component.html',
  styleUrls: ['./sp1-dialog.component.scss'],
})
export class Sp1DialogComponent {
  @Input() visible = false;
  @Input() title = '';
  @Input() subtitle?: string;
  @Input() size: DialogSize = 'md';
  @Input() type: DialogType = 'default';
  @Input() confirmLabel = 'Guardar';
  @Input() cancelLabel = 'Cancelar';
  @Input() confirmIcon = 'pi pi-check';
  @Input() loading = false;
  @Input() confirmDisabled = false;
  @Input() showFooter = true;

  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  get width(): string {
    return SIZE_MAP[this.size];
  }

  get confirmClass(): string {
    return this.type === 'danger' ? 'p-button-danger' : 'p-button-primary';
  }

  onHide(): void {
    this.visibleChange.emit(false);
    this.cancel.emit();
  }

  onConfirm(): void {
    this.confirm.emit();
  }

  onCancel(): void {
    this.visibleChange.emit(false);
    this.cancel.emit();
  }
}
