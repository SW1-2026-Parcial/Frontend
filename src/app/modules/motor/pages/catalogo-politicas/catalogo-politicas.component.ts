import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { TramiteService } from '../../services/tramite.service';
import { Politica }       from '../../../../shared/models/politica.model';

@Component({
  selector: 'app-catalogo-politicas',
  standalone: false,
  templateUrl: './catalogo-politicas.component.html',
  styleUrls: ['./catalogo-politicas.component.scss'],
})
export class CatalogoPoliticasComponent implements OnInit, OnDestroy {

  politicas: Politica[] = [];
  filtradas:  Politica[] = [];
  loading    = false;
  textoBusqueda = '';

  private destroy$ = new Subject<void>();

  constructor(
    private tramiteService: TramiteService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.tramiteService.loading$
      .pipe(takeUntil(this.destroy$))
      .subscribe(l => { this.loading = l; this.cdr.detectChanges(); });

    this.tramiteService.politicas$
      .pipe(takeUntil(this.destroy$))
      .subscribe(p => {
        this.politicas = p;
        this.aplicarFiltro();
        this.cdr.detectChanges();
      });

    this.tramiteService.cargarPoliticasPublicadas();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  aplicarFiltro(): void {
    const texto = this.textoBusqueda.toLowerCase().trim();
    this.filtradas = texto
      ? this.politicas.filter(p =>
          p.nombre.toLowerCase().includes(texto) ||
          (p.descripcion ?? '').toLowerCase().includes(texto),
        )
      : [...this.politicas];
  }

  verDetalle(politica: Politica): void {
    this.router.navigate(['/motor/politicas', politica.id]);
  }
}
