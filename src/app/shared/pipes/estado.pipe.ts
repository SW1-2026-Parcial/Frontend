import { Pipe, PipeTransform } from '@angular/core';
import { ESTADO_LABELS } from './estado-labels';

/** {{ tarea.estado | estado }} → 'En Proceso' */
@Pipe({ name: 'estado', standalone: false })
export class EstadoPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    return value ? (ESTADO_LABELS[value] ?? value) : '—';
  }
}
