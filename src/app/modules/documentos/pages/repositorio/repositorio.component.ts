import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Subject, takeUntil, timeout, TimeoutError } from 'rxjs';
import { MessageService, ConfirmationService, TreeNode } from 'primeng/api';

import { DocumentoService } from '../../services/documento.service';
import {
  Documento,
  ICONOS_EXTENSION,
  COLORES_EXTENSION,
  formatearTamano,
} from '../../../../shared/models/documento.model';

@Component({
  selector: 'app-repositorio',
  standalone: false,
  templateUrl: './repositorio.component.html',
  styleUrls: ['./repositorio.component.scss'],
  providers: [MessageService, ConfirmationService],
})
export class RepositorioComponent implements OnInit, OnDestroy {

  treeNodes: TreeNode[] = [];

  // Lista paginada
  documentos: Documento[] = [];
  totalDocs = 0;
  paginaActual = 1;
  readonly porPagina = 15;

  loading = false;
  showUpload = false;
  showPermisos = false;
  selectedDoc: Documento | null = null;

  showPreview = false;
  previewUrl: SafeResourceUrl | null = null;
  previewType: 'pdf' | 'image' | null = null;
  previewNombre = '';

  showDetalle = false;
  detalleDocId = '';

  busqueda = '';
  vistaArbol = false;

  formatearTamano = formatearTamano;

  private destroy$ = new Subject<void>();

  constructor(
    private docService: DocumentoService,
    private messageService: MessageService,
    private confirmService: ConfirmationService,
    private router: Router,
    private sanitizer: DomSanitizer,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.cargarPagina(1);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Árbol lazy ────────────────────────────────────────────────────────────

  cargarPoliticas(): void {
    this.loading = true;
    this.cdr.detectChanges();

    this.docService.treePoliticas()
      .pipe(takeUntil(this.destroy$), timeout(6000))
      .subscribe({
        next: nodos => {
          this.treeNodes = nodos.map(n => this.toTreeNode(n));
          this.totalDocs = nodos.reduce((acc, n) => acc + (n.data?.count ?? 0), 0);
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: () => {
          // Tree endpoint no disponible → ir directo a vista lista
          this.vistaArbol = false;
          this.loading = false;
          this.cdr.detectChanges();
          this.cargarPagina(1);
        },
      });
  }

  onNodeExpand(event: { node: TreeNode }): void {
    const node = event.node;
    if (node.leaf || node.children !== undefined) return; // ya cargado o sin hijos

    node.loading = true;
    this.cdr.detectChanges();

    const onError = () => {
      node.loading = false;
      node.leaf = true;       // no reintentar
      node.children = [];     // evita undefined → no vuelve a disparar
      this.treeNodes = [...this.treeNodes];
      this.cdr.detectChanges();
      this.messageService.add({
        severity: 'warn', summary: 'Sin datos', detail: 'No se pudieron cargar los elementos', life: 3000,
      });
    };

    if (node.type === 'politica') {
      this.docService.treeTramites(node.key!)
        .pipe(takeUntil(this.destroy$), timeout(6000))
        .subscribe({
          next: hijos => {
            node.children = hijos.map(h => this.toTreeNode(h));
            node.leaf = hijos.length === 0;
            node.expanded = true;
            node.loading = false;
            this.treeNodes = [...this.treeNodes];
            this.cdr.detectChanges();
          },
          error: onError,
        });

    } else if (node.type === 'tramite') {
      const tramId = node.data?.tramiteId ?? node.key!.split('_')[1];
      this.docService.treeDocumentos(tramId)
        .pipe(takeUntil(this.destroy$), timeout(6000))
        .subscribe({
          next: hijos => {
            node.children = hijos.map(h => this.toTreeNode(h));
            node.leaf = hijos.length === 0;
            node.expanded = true;
            node.loading = false;
            this.treeNodes = [...this.treeNodes];
            this.cdr.detectChanges();
          },
          error: onError,
        });
    }
  }

  private toTreeNode(n: any): TreeNode {
    return {
      key: n.key,
      label: n.label,
      type: n.type,
      data: n.data ?? null,
      leaf: n.leaf === true,
      children: n.leaf ? [] : undefined,
    };
  }

  // ── Fallback: árbol completo (sin lazy) ────────────────────────────────────

  private mapearNodosCompletos(nodos: any[]): TreeNode[] {
    return nodos
      .map(n => this.mapearNodoCompleto(n))
      .sort((a, b) => (a.label ?? '').localeCompare(b.label ?? ''));
  }

  private mapearNodoCompleto(n: any): TreeNode {
    const node: TreeNode = {
      key: n.key,
      label: n.label,
      type: n.type,
      data: n.data ?? null,
      leaf: !n.children?.length,
    };
    if (n.children?.length) {
      node.children = n.children
        .map((c: any) => this.mapearNodoCompleto(c))
        .sort((a: TreeNode, b: TreeNode) => (a.label ?? '').localeCompare(b.label ?? ''));
    }
    return node;
  }

  // ── Lista paginada ────────────────────────────────────────────────────────

  cargarPagina(page: number): void {
    this.loading = true;
    this.paginaActual = page;
    this.cdr.detectChanges();

    this.docService.obtenerListaPaginada(page, this.porPagina)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: res => {
          this.documentos = res.data;
          this.totalDocs = res.total;
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.loading = false;
          this.cdr.detectChanges();
        },
      });
  }

  onPageChange(event: any): void {
    const page = Math.floor(event.first / event.rows) + 1;
    this.cargarPagina(page);
  }

  cargar(): void {
    if (this.vistaArbol) {
      this.treeNodes = [];
      this.cargarPoliticas();
    } else {
      this.cargarPagina(this.paginaActual);
    }
  }

  onVistaChange(): void {
    if (!this.vistaArbol && this.documentos.length === 0) {
      this.cargarPagina(1);
    }
    if (this.vistaArbol && this.treeNodes.length === 0) {
      this.cargarPoliticas();
    }
  }

  // ── Selección nodo ────────────────────────────────────────────────────────

  onNodeSelect(event: any): void {
    const node: TreeNode = event.node;
    if (node.type === 'documento' && node.data) {
      this.abrirEditor(node.data as Documento);
    }
  }

  // ── Acciones ──────────────────────────────────────────────────────────────

  getIcono(ext: string): string {
    return ICONOS_EXTENSION[ext] || 'pi pi-file';
  }

  getColor(ext: string): string {
    return COLORES_EXTENSION[ext] || '#616161';
  }

  abrirEditor(doc: Documento): void {
    const editables = ['docx', 'doc', 'xlsx', 'xls', 'pptx', 'ppt', 'txt', 'csv'];
    if (editables.includes(doc.extension)) {
      this.verificarOnlyOfficeYAbrir(doc);
    } else {
      this.previsualizarODescargar(doc);
    }
  }

  private verificarOnlyOfficeYAbrir(doc: Documento): void {
    fetch('http://localhost:8088/healthcheck', { mode: 'no-cors' })
      .then(() => this.router.navigate(['/documentos/editor', doc.id]))
      .catch(() => {
        this.messageService.add({
          severity: 'warn',
          summary: 'OnlyOffice no disponible',
          detail: 'El servidor de edición no está corriendo. Descargando el archivo...',
          life: 5000,
        });
        this.descargarDirecto(doc);
      });
  }

  private descargarDirecto(doc: Documento): void {
    this.docService.obtenerUrlDescarga(doc.id).subscribe({
      next: res => this.descargarConIframe(res.url),
      error: () => {
        this.messageService.add({
          severity: 'error', summary: 'Error', detail: 'No se pudo descargar el documento', life: 4000,
        });
      },
    });
  }

  private descargarConIframe(url: string): void {
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = url;
    document.body.appendChild(iframe);
    setTimeout(() => document.body.removeChild(iframe), 10000);
  }

  previsualizarODescargar(doc: Documento): void {
    const imagenes = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    const ext = doc.extension.toLowerCase();
    const esPdf = ext === 'pdf';
    const esImagen = imagenes.includes(ext);

    this.docService.obtenerUrlDescarga(doc.id).subscribe({
      next: res => {
        if (esPdf || esImagen) {
          this.previewNombre = doc.nombre;
          this.previewType = esPdf ? 'pdf' : 'image';
          this.previewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(res.url);
          this.showPreview = true;
          this.cdr.detectChanges();
        } else {
          this.descargarConIframe(res.url);
        }
      },
      error: () => {
        this.messageService.add({
          severity: 'error', summary: 'Error', detail: 'No se pudo obtener la URL de descarga', life: 4000,
        });
        this.cdr.detectChanges();
      },
    });
  }

  cerrarPreview(): void {
    this.showPreview = false;
    this.previewUrl = null;
    this.previewType = null;
    this.previewNombre = '';
  }

  descargar(doc: Documento): void {
    this.descargarDirecto(doc);
  }

  confirmarEliminar(doc: Documento): void {
    this.confirmService.confirm({
      message: `¿Eliminar "${doc.nombre}"? Esta acción no se puede deshacer.`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.docService.eliminar(doc.id).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: doc.nombre });
            this.cargar();
          },
          error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar' }),
        });
      },
    });
  }

  abrirPermisos(doc: Documento): void {
    this.detalleDocId = doc.id;
    this.showDetalle = true;
  }

  abrirDetalle(doc: Documento): void {
    this.detalleDocId = doc.id;
    this.showDetalle = true;
  }

  onUploadComplete(): void {
    this.showUpload = false;
    this.cargar();
    this.messageService.add({ severity: 'success', summary: 'Documento subido correctamente' });
  }
}
