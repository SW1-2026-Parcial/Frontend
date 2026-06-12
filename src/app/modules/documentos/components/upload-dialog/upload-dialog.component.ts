import { Component, EventEmitter, Output, ChangeDetectorRef } from '@angular/core';
import { MessageService } from 'primeng/api';
import { DocumentoService } from '../../services/documento.service';

@Component({
  selector: 'app-upload-dialog',
  standalone: false,
  templateUrl: './upload-dialog.component.html',
  styleUrls: ['./upload-dialog.component.scss'],
  providers: [MessageService],
})
export class UploadDialogComponent {
  @Output() uploaded = new EventEmitter<void>();

  uploading = false;
  politicaId = '';
  tramiteId = '';

  constructor(
    private docService: DocumentoService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef,
  ) {}

  onSelect(event: any): void {
    const file: File = event.files?.[0] || event.currentFiles?.[0];
    if (!file) return;

    this.uploading = true;
    this.cdr.detectChanges();
    this.docService.subir(file, {
      politicaId: this.politicaId || undefined,
      tramiteId: this.tramiteId || undefined,
    }).subscribe({
      next: () => {
        this.uploading = false;
        this.cdr.detectChanges();
        this.uploaded.emit();
      },
      error: (err) => {
        this.uploading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error al subir',
          detail: err.error?.detail || 'No se pudo subir el archivo',
        });
        this.cdr.detectChanges();
      },
    });
  }
}
