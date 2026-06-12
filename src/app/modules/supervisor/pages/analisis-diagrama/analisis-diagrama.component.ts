import { Component, OnInit, inject, DestroyRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NodoUML, Calle } from '../../../../shared/models/politica.model';
import { BottleneckInfo } from '../../components/canvas-readonly/canvas-readonly.component';
import { MetricasService } from '../../services/metricas.service';
import { TramiteService } from '../../../motor/services/tramite.service';

@Component({
  standalone: false,
  selector: 'app-analisis-diagrama',
  templateUrl: './analisis-diagrama.component.html'
})
export class AnalisDiagramaComponent implements OnInit {
  nodos: NodoUML[] = [];
  calles: Calle[] = [];
  bottlenecks: BottleneckInfo[] = [];
  modoAnalitica = false;
  cargandoBottlenecks = false;
  cargandoDiagrama = true;
  errorDiagrama: string | null = null;

  private versionId = '';
  private politicaId = '';
  private destroyRef = inject(DestroyRef);

  constructor(
    private route: ActivatedRoute,
    private metricasService: MetricasService,
    private tramiteService: TramiteService
  ) {}

  ngOnInit(): void {
    this.versionId = this.route.snapshot.queryParamMap.get('versionId') ?? '';
    this.politicaId = this.route.snapshot.queryParamMap.get('politicaId') ?? '';
    this.cargarDiagrama();
  }

  private cargarDiagrama(): void {
    if (!this.politicaId) {
      this.errorDiagrama = 'No se proporcionó un ID de política.';
      this.cargandoDiagrama = false;
      return;
    }
    this.tramiteService
      .obtenerDiagramaPublicado(this.politicaId)
      .pipe(catchError(() => of(null)), takeUntilDestroyed(this.destroyRef))
      .subscribe(diagrama => {
        this.cargandoDiagrama = false;
        if (!diagrama) {
          this.errorDiagrama = 'No se pudo cargar el diagrama publicado.';
          return;
        }
        this.nodos = diagrama.nodos;
        this.calles = diagrama.calles;
      });
  }

  onToggleAnalitica(): void {
    // Issue crítico 2 corregido: && !this.cargandoBottlenecks evita doble petición
    if (this.modoAnalitica && this.bottlenecks.length === 0 && !this.cargandoBottlenecks) {
      this.cargandoBottlenecks = true;
      this.metricasService
        .obtenerCuellos(this.versionId)
        .pipe(catchError(() => of([])), takeUntilDestroyed(this.destroyRef))
        .subscribe(data => {
          this.bottlenecks = data.map((b: any) => ({
            nodoId:    b.nodeId ?? b.nodoId,
            etiqueta:  b.etiqueta,
            ranking:   b.ranking,
            promedioMs: b.avgDurationMs,   // backend devuelve avgDurationMs (ms)
          }));
          this.cargandoBottlenecks = false;
        });
    }
  }

  get sinDatosMetricas(): boolean {
    return this.modoAnalitica && !this.cargandoBottlenecks && this.bottlenecks.length === 0;
  }
}
