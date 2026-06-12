import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, switchMap, takeUntil, finalize, catchError, of } from 'rxjs';
import { MessageService } from 'primeng/api';

import { TramiteService }  from '../../services/tramite.service';
import {
  Politica, NodoUML, CampoDefinicion,
} from '../../../../shared/models/politica.model';
import { Prioridad, PRIORIDAD_LABELS } from '../../../../shared/models/tramite.model';

@Component({
  selector: 'app-detalle-politica',
  standalone: false,
  templateUrl: './detalle-politica.component.html',
  styleUrls: ['./detalle-politica.component.scss'],
  providers: [MessageService],
})
export class DetallePoliticaComponent implements OnInit, OnDestroy {

  politica:  Politica | null = null;
  loading    = true;

  primerActividad: NodoUML | null = null;
  totalActividades = 0;

  mostrarTicketDialog = false;
  ticketGenerado      = '';
  loadingIniciar      = false;

  formTramite!: FormGroup;

  readonly prioridades: { label: string; value: Prioridad }[] = [
    { label: 'Baja',    value: 'LOW'    },
    { label: 'Media',   value: 'MEDIUM' },
    { label: 'Alta',    value: 'HIGH'   },
    { label: 'Urgente', value: 'URGENT' },
  ];

  readonly PRIORIDAD_LABELS = PRIORIDAD_LABELS;

  private destroy$ = new Subject<void>();

  constructor(
    private route:          ActivatedRoute,
    private router:         Router,
    private fb:             FormBuilder,
    private tramiteService: TramiteService,
    private messageService: MessageService,
    private cdr:            ChangeDetectorRef,
  ) {
    this.formTramite = this.fb.group({
      prioridad: ['MEDIUM', Validators.required],
    });
  }

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        takeUntil(this.destroy$),
        switchMap(params => {
          const id = params.get('id')!;
          this.loading  = true;
          this.politica = null;

          return this.tramiteService.obtenerPolitica(id).pipe(
            switchMap(politica => {
              this.politica = politica;
              return this.tramiteService.obtenerDiagramaPublicado(id).pipe(
                catchError(() => of(null)),
              );
            }),
            finalize(() => { this.loading = false; this.cdr.detectChanges(); }),
          );
        }),
      )
      .subscribe({
        next: diagrama => {
          if (diagrama) {
            this.extraerInfoPrimerPaso(diagrama.nodos);
          }
          this.cdr.detectChanges();
        },
        error: () => {
          this.loading = false;
          this.messageService.add({
            severity: 'error', summary: 'Error',
            detail: 'No se pudo cargar la política', life: 4000,
          });
          this.cdr.detectChanges();
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private extraerInfoPrimerPaso(nodos: NodoUML[]): void {
    if (!Array.isArray(nodos) || !nodos.length) return;
    const actividades = nodos.filter(n => n.tipoNodo === 'ACTIVITY');
    this.totalActividades = actividades.length;

    const start = nodos.find(n => n.tipoNodo === 'START');
    if (!start?.salidas?.length) {
      this.primerActividad = actividades[0] ?? null;
      return;
    }

    const nextId = start.salidas[0].nodoDestino;
    const next = nodos.find(n => n.nodoId === nextId);

    if (next?.tipoNodo === 'ACTIVITY') {
      this.primerActividad = next;
    } else {
      this.primerActividad = actividades[0] ?? null;
    }
  }

  get camposPrimerPaso(): CampoDefinicion[] {
    return this.primerActividad?.formulario ?? [];
  }

  get camposRequeridos(): CampoDefinicion[] {
    return this.camposPrimerPaso.filter(c => c.requerido);
  }

  get camposArchivo(): CampoDefinicion[] {
    return this.camposPrimerPaso.filter(c => c.tipo === 'FILE');
  }

  iniciarTramite(): void {
    if (this.formTramite.invalid) {
      this.formTramite.markAllAsTouched();
      return;
    }
    if (!this.politica) return;

    const politicaId = this.politica!.id;
    const v = this.formTramite.value;

    this.loadingIniciar = true;
    this.tramiteService.iniciarTramite({
      politicaId,
      prioridad: v.prioridad,
    }).subscribe({
      next: resp => {
        this.loadingIniciar = false;
        this.ticketGenerado = resp.ticketNumber;
        this.mostrarTicketDialog = true;
        this.cdr.detectChanges();
      },
      error: err => {
        this.loadingIniciar = false;
        this.messageService.add({
          severity: 'error', summary: 'Error',
          detail: err?.error?.detail ?? err?.error?.message ?? 'No se pudo iniciar el trámite', life: 5000,
        });
        this.cdr.detectChanges();
      },
    });
  }

  volver(): void {
    this.router.navigate(['/motor/politicas']);
  }

  irABandeja(): void {
    this.mostrarTicketDialog = false;
    this.router.navigate(['/motor']);
  }
}
