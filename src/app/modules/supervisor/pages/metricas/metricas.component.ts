/*
 * MÓDULO: Supervisor
 * DESCRIPCIÓN: Métricas de desempeño y cuellos de botella (CU-14)
 */

import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Subject, takeUntil, forkJoin } from 'rxjs';
import { HttpClient } from '@angular/common/http';

import { MetricasService } from '../../services/metricas.service';
import {
  BottleneckResponse,
  PerformanceResponse,
} from '../../../../shared/models/metrics.model';
import { Politica } from '../../../../shared/models/politica.model';
import { environment } from '../../../../../environments/environment';

interface VersionOpcion {
  label: string;
  value: string;
}

@Component({
  selector:    'app-metricas',
  standalone:  false,
  templateUrl: './metricas.component.html',
  styleUrls:   ['./metricas.component.scss'],
})
export class MetricasComponent implements OnInit, OnDestroy {

  politicas:        Politica[] = [];
  versionOpciones:  VersionOpcion[] = [];
  versionSeleccionada: VersionOpcion | null = null;

  desde  = '';
  hasta  = '';

  loading          = false;
  performance:     PerformanceResponse | null = null;
  bottlenecks:     BottleneckResponse[] = [];
  errorMsg         = '';

  // Chart.js data
  chartData:   unknown = null;
  chartOptions: unknown = null;

  private readonly BASE = `${environment.apiUrl}`;
  private destroy$ = new Subject<void>();

  constructor(
    private metricasService: MetricasService,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.initChartOptions();
    this.cargarPoliticas();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private cargarPoliticas(): void {
    this.http.get<Politica[]>(`${this.BASE}/policies`).subscribe({
      next: all => {
        this.politicas = all.filter(p => {
          const estado = p.estado ?? (p as any)['status'] ?? (p as any)['state'];
          return estado === 'PUBLISHED';
        });
        this.cdr.detectChanges();
      },
    });
  }

  onPoliticaChange(politica: Politica): void {
    this.versionOpciones     = [];
    this.versionSeleccionada = null;
    this.performance         = null;
    this.bottlenecks         = [];
    this.chartData           = null;
    this.errorMsg            = '';

    this.http
      .get<{ id: string; numeroVersion: number; estado: string }[]>(
        `${this.BASE}/policies/${politica.id}/versions`,
      )
      .subscribe({
        next: versiones => {
          this.versionOpciones = versiones
            .filter(v => {
              const estado = v.estado ?? (v as any)['status'] ?? (v as any)['state'];
              return estado === 'PUBLISHED';
            })
            .map(v => ({
              label: `v${v.numeroVersion}`,
              value: v.id,
            }));
          if (this.versionOpciones.length === 0) {
            this.errorMsg = 'Esta política no tiene versiones publicadas.';
          }
        },
        error: () => {
          this.errorMsg = 'No se pudieron cargar las versiones de la política.';
        },
      });
  }

  consultar(): void {
    if (!this.versionSeleccionada) return;
    this.loading  = true;
    this.errorMsg = '';

    const versionId = this.versionSeleccionada.value;

    forkJoin({
      performance: this.metricasService.obtenerPerformance(
        versionId,
        this.desde || undefined,
        this.hasta || undefined,
      ),
      bottlenecks: this.metricasService.obtenerCuellos(versionId),
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ performance, bottlenecks }) => {
          this.performance  = performance;
          this.bottlenecks  = bottlenecks;
          this.buildChartData(bottlenecks);
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.loading  = false;
          this.errorMsg = 'No se pudieron cargar las métricas.';
        },
      });
  }

  private buildChartData(bottlenecks: BottleneckResponse[]): void {
    const labels = bottlenecks.map(b => b.etiqueta);
    const data   = bottlenecks.map(b => Math.round(b.avgDurationMs / 60000 * 10) / 10);

    // Color degradado: rojo para rank 1, verde para el último
    const colors = bottlenecks.map((_, i) => {
      const ratio = i / Math.max(bottlenecks.length - 1, 1);
      const r = Math.round(220 - ratio * (220 - 37));
      const g = Math.round(38  + ratio * (150 - 38));
      const b = 70;
      return `rgba(${r},${g},${b},0.8)`;
    });

    this.chartData = {
      labels,
      datasets: [{
        label: 'Tiempo promedio (min)',
        data,
        backgroundColor: colors,
        borderColor:     colors.map(c => c.replace('0.8', '1')),
        borderWidth:     1,
        borderRadius:    4,
      }],
    };
  }

  private initChartOptions(): void {
    this.chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx: { parsed: { y: number } }) =>
              ` ${ctx.parsed.y} min`,
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { size: 12 } },
        },
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Minutos',
          },
          ticks: { font: { size: 11 } },
        },
      },
    };
  }

  // ── Helpers ───────────────────────────────────────────────────────────────────

  formatMs(ms: number): string {
    if (ms < 60000)   return `${(ms / 1000).toFixed(0)}s`;
    if (ms < 3600000) return `${(ms / 60000).toFixed(1)} min`;
    return `${(ms / 3600000).toFixed(1)} h`;
  }

  formatMsLong(ms: number): string {
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    if (h > 0) return `${h}h ${m}min`;
    return `${m}min`;
  }

  rankingSeverity(r: number): 'danger' | 'warn' | 'secondary' | 'success' {
    if (r === 1) return 'danger';
    if (r === 2) return 'warn';
    if (r <= 4)  return 'secondary';
    return 'success';
  }
}
