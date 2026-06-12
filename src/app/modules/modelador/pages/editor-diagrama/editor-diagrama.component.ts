/*
 * MÓDULO: M1 Modelador
 * CASO DE USO: CU-02, CU-03, CU-04, CU-05, CU-06
 * ACTOR: Administrador
 * DESCRIPCIÓN: Página principal del editor de políticas — orquesta canvas, panel y dialogs.
 *
 * Los tres dialogs (Conexión, Calle, IA) fueron extraídos a sub-componentes en ./dialogs/.
 * Este componente solo maneja:
 *   – Carga del diagrama (API + estado)
 *   – Eventos del canvas
 *   – Llamadas a los servicios tras recibir confirmación de cada dialog
 *   – WebSocket colaborativo y micrófono
 */

import { Component, OnInit, OnDestroy, ViewChild, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { EMPTY, Subject, switchMap, takeUntil, finalize } from 'rxjs';
import { MessageService, ConfirmationService } from 'primeng/api';
import { handleCanvasWsEvent } from './canvas-ws-handler';

import { PoliticaService }    from '../../services/politica.service';
import { DiagramaService }    from '../../services/diagrama.service';
import { DepartamentoService } from '../../../usuarios/services/departamento.service';
import { RealTimeService }    from '../../../../core/services/real-time.service';
import { MicrophoneService }  from '../../../../core/services/microphone.service';
import { AuthService }        from '../../../../core/auth/auth.service';
import {
  Politica, NodoUML, TipoNodo, VersionPolitica, ResultadoValidacion,
  Calle, AdminPresenciaInfo, CanvasWsEnvelope,
} from '../../../../shared/models/politica.model';
import { Departamento } from '../../../../shared/models/departamento.model';
import { ToolbarAccion } from '../../components/toolbar-diagrama/toolbar-diagrama.component';
import { CanvasComponent } from '../../components/canvas/canvas.component';
import { ConexionConfirmada } from './dialogs/dialog-conexion.component';
import { CalleConfirmada }    from './dialogs/dialog-calle.component';
import { IAConfirmada }       from './dialogs/dialog-ia.component';

const LANE_H       = 220;
const NEUTRAL_H    = 100;
const CANVAS_W     = 2600;
const LANE_LABEL_W = 44;

@Component({
  selector: 'app-editor-diagrama',
  standalone: false,
  templateUrl: './editor-diagrama.component.html',
  styleUrls: ['./editor-diagrama.component.scss'],
  providers: [MessageService, ConfirmationService],
})
export class EditorDiagramaComponent implements OnInit, OnDestroy {

  @ViewChild(CanvasComponent) canvasRef?: CanvasComponent;

  // ── Estado de la política / versión ────────────────────────────────────────
  politica:       Politica | null       = null;
  versionActiva:  VersionPolitica | null = null;
  loadingDiagrama = true;

  // ── Estado del canvas ──────────────────────────────────────────────────────
  panelVisible  = false;   // panel de propiedades del nodo seleccionado
  modoConectar  = false;
  modoEliminar  = false;
  presencia:    AdminPresenciaInfo[] = [];

  // ── Estado de los tres dialogs ─────────────────────────────────────────────
  mostrarDialogConexion = false;
  conexionPendiente: { origen: NodoUML; destino: NodoUML } | null = null;
  loadingConexion = false;

  mostrarDialogCalle  = false;
  calleEditando: Calle | null = null;
  loadingCalle  = false;
  departamentos: Departamento[] = [];

  mostrarDialogIA     = false;
  loadingIA           = false;
  instruccionIAInicial = '';   // pre-fill desde micrófono

  // ── Estado del micrófono ───────────────────────────────────────────────────
  micActivo           = false;
  transcripcionActual = '';
  mostrarTranscripcion = false;
  get micSoportado(): boolean { return this.micService.isSupported; }

  // ── Validación ─────────────────────────────────────────────────────────────
  resultadoValidacion: ResultadoValidacion | null = null;
  mostrarPanelValidacion = false;

  // ── Getters derivados ──────────────────────────────────────────────────────
  get esEditable(): boolean { return this.versionActiva?.estado === 'DRAFT'; }
  get puedePublicar(): boolean { return this.esEditable && (this.versionActiva?.validado ?? false); }

  get departamentosOpciones(): { label: string; value: string | null }[] {
    return [
      { label: 'Sin asignar', value: null },
      ...this.departamentos.filter(d => d.activo).map(d => ({ label: d.nombre, value: d.id })),
    ];
  }

  private destroy$ = new Subject<void>();

  constructor(
    private route:               ActivatedRoute,
    private router:              Router,
    private politicaService:     PoliticaService,
    private diagramaService:     DiagramaService,
    private departamentoService: DepartamentoService,
    private rt:                  RealTimeService,
    private authService:         AuthService,
    private micService:          MicrophoneService,
    private messageService:      MessageService,
    private confirmationService: ConfirmationService,
    private cdr:                 ChangeDetectorRef,
  ) {}

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  ngOnInit(): void {
    // Departamentos (para el dialog de calles)
    this.departamentos = this.departamentoService.getDepartamentosSnapshot();
    if (!this.departamentos.length) this.departamentoService.cargarDepartamentos();
    this.departamentoService.departamentos$.pipe(takeUntil(this.destroy$))
      .subscribe(d => this.departamentos = d);

    // Micrófono
    this.micService.active$.pipe(takeUntil(this.destroy$))
      .subscribe(active => { this.micActivo = active; });
    this.micService.transcript$.pipe(takeUntil(this.destroy$))
      .subscribe({
        next: text => { this.transcripcionActual = text; this.mostrarTranscripcion = true; },
        error: () => this.messageService.add({
          severity: 'error', summary: 'Error de micrófono',
          detail: 'No se pudo acceder al micrófono. Verifica los permisos.', life: 4000,
        }),
      });

    // Cargar diagrama según :id de la ruta
    this.route.paramMap.pipe(
      takeUntil(this.destroy$),
      switchMap(params => {
        const politicaId = params.get('id');
        if (!politicaId) {
          this.loadingDiagrama = false;
          void this.router.navigate(['/modelador']);
          return EMPTY;
        }
        this.loadingDiagrama = true;
        this.politica = null;
        this.versionActiva = null;
        this.diagramaService.limpiar();

        return this.politicaService.obtenerPorId(politicaId).pipe(
          switchMap(politica => {
            this.politica = politica;
            return this.politicaService.obtenerVersiones(politicaId);
          }),
          switchMap(versiones => {
            const draft = versiones.find(v => v.estado === 'DRAFT');
            if (draft) {
              this.versionActiva = draft;
              return this.politicaService.obtenerDiagrama(politicaId, draft.id);
            }
            return this.politicaService.crearVersion(politicaId).pipe(
              switchMap(nueva => {
                this.versionActiva = nueva;
                return this.politicaService.obtenerDiagrama(politicaId, nueva.id);
              }),
            );
          }),
          finalize(() => { this.loadingDiagrama = false; this.cdr.detectChanges(); }),
        );
      }),
    ).subscribe({
      next: diagrama => {
        this.diagramaService.inicializar(this.versionActiva!.id, diagrama.nodos ?? [], diagrama.calles ?? []);
        this.suscribirCanvasWs(this.versionActiva!.id);
        this.cdr.detectChanges();
      },
      error: err => {
        this.messageService.add({
          severity: 'error', summary: 'Error',
          detail: err?.error?.message ?? 'No se pudo cargar el diagrama', life: 5000,
        });
        this.diagramaService.limpiar();
        this.cdr.detectChanges();
      },
    });
  }

  ngOnDestroy(): void {
    this.micService.abort();
    this.destroy$.next();
    this.destroy$.complete();
    this.diagramaService.limpiar();
  }

  // ── Toolbar ────────────────────────────────────────────────────────────────

  onToolbarAccion(accion: ToolbarAccion): void {
    switch (accion.tipo) {
      case 'toggle-conectar':
        this.modoConectar = !this.modoConectar;
        if (this.modoConectar) this.modoEliminar = false;
        if (!this.modoConectar) this.canvasRef?.cancelarConexion();
        break;
      case 'toggle-eliminar':
        this.modoEliminar = !this.modoEliminar;
        if (this.modoEliminar) {
          this.modoConectar = false;
          this.canvasRef?.cancelarConexion();
          this.mostrarDialogConexion = false;
          this.conexionPendiente = null;
        }
        break;
      case 'agregar-calle':
        this.abrirDialogCalle();
        break;
      case 'ia-sugerir':
        this.abrirDialogIA();
        break;
    }
  }

  // ── Panel de nodo ──────────────────────────────────────────────────────────

  onNodoEditarRequest(nodo: NodoUML): void {
    if (!this.esEditable) return;
    this.diagramaService.seleccionarNodo(nodo);
    this.panelVisible = true;
  }

  cerrarPanelNodo(): void {
    this.panelVisible = false;
    this.diagramaService.seleccionarNodo(null);
  }

  // ── Crear nodo ─────────────────────────────────────────────────────────────

  onNodoCreadoRequest(req: { tipoNodo: TipoNodo; x: number; y: number; calleId: string | null }): void {
    if (!this.esEditable) return;
    const etiqueta = req.tipoNodo === 'ACTIVITY' ? 'Nueva actividad' : req.tipoNodo;
    this.diagramaService.crearNodo(req.tipoNodo, etiqueta, req.x, req.y, req.calleId).subscribe({
      next: nodo => { this.diagramaService.agregarNodoEnEstado(nodo); this.publishCanvasEvent('NODO_CREADO', nodo); },
      error: err => this.msgError(err, 'No se pudo crear el nodo'),
    });
  }

  // ── Dialog Conexión ────────────────────────────────────────────────────────

  onConexionSolicitada(event: { origen: NodoUML; destino: NodoUML }): void {
    this.conexionPendiente = event;
    if (event.origen.tipoNodo === 'DECISION') {
      this.mostrarDialogConexion = true;   // necesita elegir rama
    } else {
      this.onConfirmarConexion({ rama: false });  // conexión directa sin dialog
    }
  }

  onConfirmarConexion(result: ConexionConfirmada): void {
    if (!this.conexionPendiente) return;
    const { origen, destino } = this.conexionPendiente;
    const etiqueta = result.rama ? 'Alternativa' : 'Principal';
    const etiquetaFinal = origen.tipoNodo === 'DECISION' ? etiqueta : null;

    this.loadingConexion = true;
    this.diagramaService.conectar(origen.nodoId, destino.nodoId, result.rama, etiquetaFinal).subscribe({
      next: nodoActualizado => {
        this.loadingConexion    = false;
        this.mostrarDialogConexion = false;
        this.conexionPendiente  = null;
        this.modoConectar       = false;
        this.canvasRef?.cancelarConexion();
        this.publishCanvasEvent('CONEXION_CREADA', nodoActualizado);
        this.messageService.add({ severity: 'success', summary: 'Conexión creada',
          detail: `${origen.etiqueta} → ${destino.etiqueta}`, life: 3000 });
      },
      error: err => { this.loadingConexion = false; this.msgError(err, 'No se pudo crear la conexión'); },
    });
  }

  onCancelarConexion(): void {
    this.mostrarDialogConexion = false;
    this.conexionPendiente     = null;
    this.modoConectar          = false;
    this.canvasRef?.cancelarConexion();
  }

  // ── Dialog Calle ───────────────────────────────────────────────────────────

  abrirDialogCalle(): void {
    this.calleEditando = null;
    this.mostrarDialogCalle = true;
  }

  onCalleEditarRequest(calle: Calle): void {
    this.calleEditando = calle;
    this.mostrarDialogCalle = true;
  }

  onConfirmarCalle(result: CalleConfirmada): void {
    const { nombre, departamentoId } = result;
    this.loadingCalle = true;

    if (this.calleEditando) {
      this.diagramaService.actualizarCalle(this.calleEditando.calleId, { nombre, departamentoId }).subscribe({
        next: calle => {
          const depto = this.departamentos.find(d => d.id === calle.departamentoId);
          const enriquecida = { ...calle, departamentoNombre: depto?.nombre ?? null };
          this.diagramaService.actualizarCalleEnEstado(enriquecida);
          this.publishCanvasEvent('CALLE_ACTUALIZADA', enriquecida);
          this.loadingCalle = false; this.mostrarDialogCalle = false; this.calleEditando = null;
          this.messageService.add({ severity: 'success', summary: 'Calle actualizada', detail: nombre, life: 2500 });
        },
        error: err => { this.loadingCalle = false; this.msgError(err, 'No se pudo actualizar la calle'); },
      });
    } else {
      const { calles } = this.diagramaService.getEstadoSnapshot();
      this.diagramaService.crearCalle({
        nombre, departamentoId,
        posicionCanvas: { x: LANE_LABEL_W, y: NEUTRAL_H + calles.length * LANE_H },
        dimensiones:    { ancho: CANVAS_W - LANE_LABEL_W, alto: LANE_H },
        orden:          calles.length,
      }).subscribe({
        next: calle => {
          let enriquecida = calle;
          if (departamentoId) {
            const depto = this.departamentos.find(d => d.id === departamentoId);
            if (depto) { enriquecida = { ...calle, departamentoNombre: depto.nombre }; this.diagramaService.actualizarCalleEnEstado(enriquecida); }
          }
          this.publishCanvasEvent('CALLE_CREADA', enriquecida);
          this.loadingCalle = false; this.mostrarDialogCalle = false;
          this.messageService.add({ severity: 'success', summary: 'Calle agregada', detail: nombre, life: 2500 });
        },
        error: err => { this.loadingCalle = false; this.msgError(err, 'No se pudo crear la calle'); },
      });
    }
  }

  onCancelarCalle(): void {
    this.mostrarDialogCalle = false;
    this.calleEditando = null;
  }

  // ── Dialog IA ──────────────────────────────────────────────────────────────

  abrirDialogIA(instruccionPreloaded = ''): void {
    this.instruccionIAInicial = instruccionPreloaded;
    this.mostrarDialogIA = true;
  }

  onConfirmarIA(result: IAConfirmada): void {
    if (!this.politica || !this.versionActiva) return;
    this.loadingIA = true;
    this.politicaService.generarConIA(this.politica.id, this.versionActiva.id, result.instruccion).subscribe({
      next: diagrama => {
        this.loadingIA = false; this.mostrarDialogIA = false;
        this.diagramaService.inicializar(this.versionActiva!.id, diagrama.nodos ?? [], diagrama.calles ?? []);
        this.messageService.add({ severity: 'success', summary: 'Diagrama generado',
          detail: 'La IA actualizó el canvas con el nuevo diagrama.', life: 4000 });
      },
      error: err => { this.loadingIA = false; this.msgError(err, 'El asistente de IA no pudo procesar la solicitud'); },
    });
  }

  onCancelarIA(): void {
    this.mostrarDialogIA = false;
    this.loadingIA = false;
  }

  // ── Micrófono ──────────────────────────────────────────────────────────────

  toggleMicrofono(): void {
    if (!this.micService.isSupported) {
      this.messageService.add({ severity: 'warn', summary: 'No disponible',
        detail: 'Tu navegador no soporta reconocimiento de voz. Usa Chrome o Edge.', life: 5000 });
      return;
    }
    this.micActivo ? this.micService.stop() : this.micService.start();
  }

  enviarTranscripcionAIA(): void {
    const texto = this.transcripcionActual.trim();
    if (!texto) return;
    this.micService.stop();
    this.mostrarTranscripcion = false;
    this.transcripcionActual  = '';
    this.abrirDialogIA(texto);   // pre-fill desde micrófono
  }

  descartarTranscripcion(): void {
    this.micService.stop();
    this.mostrarTranscripcion = false;
    this.transcripcionActual  = '';
  }

  // ── Validar (CU-05) ────────────────────────────────────────────────────────

  validar(): void {
    if (!this.politica || !this.versionActiva) return;
    this.politicaService.validar(this.politica.id, this.versionActiva.id).subscribe({
      next: resultado => {
        this.resultadoValidacion    = resultado;
        this.mostrarPanelValidacion = true;
        if (resultado.valido) {
          this.versionActiva = { ...this.versionActiva!, validado: true };
          this.messageService.add({ severity: 'success', summary: 'Diagrama válido',
            detail: `${resultado.warnings?.length ?? 0} advertencia(s). Listo para publicar.`, life: 4000 });
        } else {
          this.messageService.add({ severity: 'warn', summary: 'Diagrama inválido',
            detail: `${resultado.errores.length} error(es) bloqueante(s).`, life: 5000 });
        }
      },
      error: err => this.msgError(err, 'No se pudo validar el diagrama'),
    });
  }

  // ── Publicar (CU-06) ───────────────────────────────────────────────────────

  publicar(): void {
    if (!this.politica || !this.versionActiva) return;
    this.confirmationService.confirm({
      message: `¿Publicar la versión ${this.versionActiva.numeroVersion}? Esta acción es irreversible.`,
      header: 'Publicar política',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.politicaService.publicar(this.politica!.id, this.versionActiva!.id).subscribe({
          next: version => {
            this.versionActiva = version;
            this.politica = { ...this.politica!, estado: 'PUBLISHED' };
            this.messageService.add({ severity: 'success', summary: 'Política publicada',
              detail: `Versión ${version.numeroVersion} publicada correctamente.`, life: 4000 });
          },
          error: err => this.msgError(err, 'No se pudo publicar'),
        });
      },
    });
  }

  volver(): void { this.router.navigate(['/modelador']); }

  // ── WebSocket colaborativo ─────────────────────────────────────────────────

  publishCanvasEvent(tipo: string, payload: unknown): void {
    if (!this.versionActiva) return;
    const usuario = this.authService.getUsuarioActual();
    this.rt.publishCanvasEvent(this.versionActiva.id, {
      tipo, versionId: this.versionActiva.id,
      adminEmail: usuario?.email ?? '', payload,
      timestamp: new Date().toISOString(),
    } as CanvasWsEnvelope);
  }

  private suscribirCanvasWs(versionId: string): void {
    const usuario = this.authService.getUsuarioActual();
    if (!usuario) return;
    this.rt.joinCanvas(versionId, { email: usuario.email, nombre: usuario.nombre });
    this.rt.canvas$(versionId)
      .pipe(takeUntil(this.destroy$))
      .subscribe(env => handleCanvasWsEvent(env, usuario.email, {
        diagramaService:  this.diagramaService,
        politicaService:  this.politicaService,
        messageService:   this.messageService,
        destroy$:         this.destroy$,
        getVersionActiva: () => this.versionActiva,
        getPolitica:      () => this.politica,
        setPresencia:     lista => { this.presencia = lista; },
        getPresencia:     () => this.presencia,
        onPoliticaPublicada: () => {
          if (this.versionActiva) this.versionActiva = { ...this.versionActiva, estado: 'PUBLISHED' };
          if (this.politica)      this.politica      = { ...this.politica, estado: 'PUBLISHED' };
        },
      }));
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private msgError(err: unknown, fallback: string): void {
    const detail = (err as any)?.error?.message ?? fallback;
    this.messageService.add({ severity: 'error', summary: 'Error', detail, life: 5000 });
  }
}
