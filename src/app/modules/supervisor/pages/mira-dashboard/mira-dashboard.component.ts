import { Component, OnInit } from '@angular/core';
import {
  MiraService,
  MiraDashboard,
  RiesgoItem,
  RiesgoResponse,
  AnomaliaResponse,
  MiraAlerta,
  TareaPriorizada,
  PriorizacionResponse,
} from '../../../../core/services/mira.service';

@Component({
  selector: 'app-mira-dashboard',
  standalone: false,
  templateUrl: './mira-dashboard.component.html',
  styleUrls: ['./mira-dashboard.component.scss'],
})
export class MiraDashboardComponent implements OnInit {
  dashboard: MiraDashboard | null = null;
  riesgos: RiesgoItem[] = [];
  anomalias: MiraAlerta[] = [];
  tareasPriorizadas: TareaPriorizada[] = [];
  loading = true;
  errorCarga = false;
  activeTab = 0;

  constructor(private miraService: MiraService) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.loading = true;
    this.errorCarga = false;

    this.miraService.getDashboard().subscribe({
      next: (data) => {
        this.dashboard = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.errorCarga = true;
      },
    });

    this.miraService.getRiesgos().subscribe({
      next: (res) => (this.riesgos = res.tramites),
      error: () => {},
    });
    this.miraService.getAnomalias().subscribe({
      next: (res) => (this.anomalias = res.anomalias),
      error: () => {},
    });
    this.miraService.getPriorizacion().subscribe({
      next: (res) => (this.tareasPriorizadas = res.tareas),
      error: () => {},
    });
  }

  get scoreColor(): string {
    if (!this.dashboard) return '#4caf50';
    const s = this.dashboard.scoreRiesgoGlobal;
    if (s >= 0.7) return '#f44336';
    if (s >= 0.4) return '#ff9800';
    return '#4caf50';
  }

  get scoreLabel(): string {
    if (!this.dashboard) return 'Sin datos';
    const s = this.dashboard.scoreRiesgoGlobal;
    if (s >= 0.7) return 'Situación crítica';
    if (s >= 0.4) return 'Atención requerida';
    return 'Sistema operando con normalidad';
  }

  get totalTramites(): number {
    if (!this.dashboard?.resumenRiesgos) return 1;
    const r = this.dashboard.resumenRiesgos;
    return (r['BAJO'] ?? 0) + (r['MEDIO'] ?? 0) + (r['ALTO'] ?? 0) + (r['CRITICO'] ?? 0) || 1;
  }

  severityRiesgo(nivel: string): 'danger' | 'warn' | 'success' | 'info' {
    switch (nivel) {
      case 'CRITICO': return 'danger';
      case 'ALTO': return 'warn';
      case 'MEDIO': return 'warn';
      default: return 'success';
    }
  }

  severityAnomalia(gravedad: string): 'danger' | 'warn' | 'success' | 'info' {
    return gravedad === 'ERROR' ? 'danger' : 'warn';
  }
}
