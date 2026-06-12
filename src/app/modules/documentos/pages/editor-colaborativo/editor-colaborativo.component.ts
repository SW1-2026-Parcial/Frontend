import {
  Component,
  OnInit,
  OnDestroy,
  ElementRef,
  ViewChild,
  AfterViewInit,
  ChangeDetectorRef,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';

import { environment } from '../../../../../environments/environment';
import { DocumentoService } from '../../services/documento.service';
import { EditUrlResponse } from '../../../../shared/models/documento.model';

declare const DocsAPI: any;

@Component({
  selector: 'app-editor-colaborativo',
  standalone: false,
  templateUrl: './editor-colaborativo.component.html',
  styleUrls: ['./editor-colaborativo.component.scss'],
  providers: [MessageService],
})
export class EditorColaborativoComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('editorContainer', { static: true }) editorContainer!: ElementRef;

  documentoId = '';
  nombreDoc = '';
  loading = true;
  error = '';
  showDetalle = false;
  private docEditor: any = null;
  private scriptLoaded = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private docService: DocumentoService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.documentoId = this.route.snapshot.paramMap.get('documentoId') || '';
    if (!this.documentoId) {
      this.error = 'ID de documento no proporcionado';
      this.loading = false;
    }
  }

  ngAfterViewInit(): void {
    if (this.documentoId) {
      this.initEditor();
    }
  }

  ngOnDestroy(): void {
    if (this.docEditor) {
      this.docEditor.destroyEditor();
    }
  }

  volver(): void {
    this.router.navigate(['/documentos']);
  }

  private initEditor(): void {
    this.docService.obtenerConfigEdicion(this.documentoId).subscribe({
      next: (config) => {
        this.nombreDoc = config.nombre;
        this.loadOnlyOfficeScript(config);
      },
      error: (err) => {
        this.error = err.error?.detail || 'No se pudo cargar la configuración del editor';
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  private loadOnlyOfficeScript(config: EditUrlResponse): void {
    const onlyofficeUrl = config.onlyofficeUrl || environment.onlyofficeUrl;

    if (this.scriptLoaded || (window as any).DocsAPI) {
      this.createEditor(config);
      return;
    }

    const script = document.createElement('script');
    script.src = `${onlyofficeUrl}/web-apps/apps/api/documents/api.js`;
    script.onload = () => {
      this.scriptLoaded = true;
      this.createEditor(config);
      this.cdr.detectChanges();
    };
    script.onerror = () => {
      this.error = 'No se pudo conectar con el servidor OnlyOffice. Verifica que Docker esté corriendo (docker compose up -d).';
      this.loading = false;
      this.messageService.add({
        severity: 'warn',
        summary: 'OnlyOffice no disponible',
        detail: 'El servidor de edición no está corriendo. Puedes descargar el documento desde el repositorio.',
        life: 8000,
      });
      this.cdr.detectChanges();
    };
    document.head.appendChild(script);
  }

  private createEditor(config: EditUrlResponse): void {
    this.loading = false;
    this.cdr.detectChanges();

    const editorConfig: any = {
      ...(config.config || {}),
      token: config.token,
      height: '100%',
      width: '100%',
      events: {
        onReady: () => {
          this.messageService.add({
            severity: 'info',
            summary: 'Editor listo',
            detail: `Editando: ${config.nombre}`,
            life: 3000,
          });
        },
        onError: (event: any) => {
          console.error('OnlyOffice error:', event);
          this.messageService.add({
            severity: 'error',
            summary: 'Error del editor',
            detail: event?.data?.errorDescription || 'Error desconocido',
          });
        },
        onDocumentStateChange: (event: any) => {
          // event.data = true si hay cambios sin guardar
          if (event.data) {
            document.title = `● ${config.nombre} — SP1 BPM`;
          } else {
            document.title = `${config.nombre} — SP1 BPM`;
          }
        },
      },
    };

    try {
      this.docEditor = new DocsAPI.DocEditor(
        this.editorContainer.nativeElement.id,
        editorConfig,
      );
    } catch (e) {
      this.error = 'Error al inicializar el editor. Verifica la configuración de OnlyOffice.';
      console.error('DocsAPI.DocEditor error:', e);
    }
  }
}
