/*
 * MÓDULO: M1 Modelador
 * CASO DE USO: CU-03 — Configuración de nodo
 * ACTOR: Administrador
 * DESCRIPCIÓN: Panel lateral para configurar propiedades del nodo seleccionado.
 *              Para nodos ACTIVITY: formulario dinámico + instrucciones.
 *              La asignación de calle se hace arrastrando el nodo al canvas.
 */

import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

import { DiagramaService } from '../../services/diagrama.service';
import { NodoUML, CampoDefinicion, TipoCampo } from '../../../../shared/models/politica.model';

@Component({
  selector: 'app-panel-nodo',
  standalone: false,
  templateUrl: './panel-nodo.component.html',
  styleUrls: ['./panel-nodo.component.scss'],
})
export class PanelNodoComponent implements OnInit, OnDestroy {

  @Output() cerrar = new EventEmitter<void>();

  nodo: NodoUML | null = null;
  form!: FormGroup;

  readonly tiposCampo: { label: string; value: TipoCampo }[] = [
    { label: 'Texto',       value: 'TEXT'     },
    { label: 'Número',      value: 'NUMBER'   },
    { label: 'Fecha',       value: 'DATE'     },
    { label: 'Selector',    value: 'SELECT'   },
    { label: 'Archivo',     value: 'FILE'     },
    { label: 'Texto largo', value: 'TEXTAREA' },
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private diagramaService: DiagramaService,
    private fb: FormBuilder,
  ) {}

  ngOnInit(): void {
    this.inicializarForm(null);

    this.diagramaService.nodoSeleccionado$
      .pipe(takeUntil(this.destroy$))
      .subscribe(nodo => {
        this.nodo = nodo;
        this.inicializarForm(nodo);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Form ────────────────────────────────────────────────────────────────────

  private inicializarForm(nodo: NodoUML | null): void {
    this.form = this.fb.group({
      etiqueta:          [nodo?.etiqueta ?? '', [Validators.required, Validators.minLength(2)]],
      instruccionAvance: [nodo?.instruccionAvance ?? ''],
      instruccionRechazo:[nodo?.instruccionRechazo ?? ''],
      campos: this.fb.array(
        (nodo?.formulario ?? []).map(c => this.campGroup(c)),
      ),
    });
  }

  private campGroup(c?: Partial<CampoDefinicion>): FormGroup {
    return this.fb.group({
      nombre:    [c?.nombre    ?? '', Validators.required],
      etiqueta:  [c?.etiqueta  ?? '', Validators.required],
      tipo:      [c?.tipo      ?? 'TEXT', Validators.required],
      requerido: [c?.requerido ?? false],
      opciones:  [c?.opciones?.join('\n') ?? ''],
    });
  }

  get camposArray(): FormArray {
    return this.form.get('campos') as FormArray;
  }

  agregarCampo(): void { this.camposArray.push(this.campGroup()); }
  quitarCampo(i: number): void { this.camposArray.removeAt(i); }

  reordenarCampo(oldIndex: number, newIndex: number): void {
    if (oldIndex === newIndex) return;
    const array = this.camposArray;
    const control = array.at(oldIndex);
    array.removeAt(oldIndex);
    array.insert(newIndex, control);
  }

  // ── Guardar ─────────────────────────────────────────────────────────────────

  guardar(): void {
    if (!this.nodo || this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const val = this.form.value;

    // Actualizar etiqueta si cambió
    const cambioBase: Record<string, any> = {};
    if (val.etiqueta !== this.nodo.etiqueta) cambioBase['etiqueta'] = val.etiqueta;

    if (this.esActivity) {
      const campos: CampoDefinicion[] = val.campos.map((c: any) => ({
        nombre:    c.nombre,
        etiqueta:  c.etiqueta,
        tipo:      c.tipo,
        requerido: c.requerido,
        opciones:  c.tipo === 'SELECT' && c.opciones
          ? c.opciones.split('\n').map((o: string) => o.trim()).filter(Boolean)
          : undefined,
      }));

      if (Object.keys(cambioBase).length) {
        this.diagramaService.actualizarNodo(this.nodo.nodoId, cambioBase).subscribe({
          next: n => this.diagramaService.actualizarNodoEnEstado(n),
        });
      }

      this.diagramaService.configurarNodo(this.nodo.nodoId, {
        formulario:         campos,
        instruccionAvance:  val.instruccionAvance  || null,
        instruccionRechazo: val.instruccionRechazo || null,
      }).subscribe({
        next: n => this.diagramaService.actualizarNodoEnEstado(n),
      });

    } else if (Object.keys(cambioBase).length) {
      this.diagramaService.actualizarNodo(this.nodo.nodoId, cambioBase).subscribe({
        next: n => this.diagramaService.actualizarNodoEnEstado(n),
      });
    }
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  get esActivity(): boolean { return this.nodo?.tipoNodo === 'ACTIVITY'; }
  get esDecision(): boolean { return this.nodo?.tipoNodo === 'DECISION'; }
}
