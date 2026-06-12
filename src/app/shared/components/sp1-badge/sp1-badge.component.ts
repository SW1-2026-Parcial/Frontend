import { Component, Input } from '@angular/core';
import { ESTADO_LABELS } from '../../pipes/estado-labels';

export type BadgeEstado =
  | 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED'
  | 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  | 'ADMINISTRADOR' | 'SUPERVISOR' | 'FUNCIONARIO'
  | 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  | 'ACTIVO' | 'INACTIVO';

@Component({
  selector: 'app-sp1-badge',
  standalone: false,
  templateUrl: './sp1-badge.component.html',
  styleUrls: ['./sp1-badge.component.scss'],
})
export class Sp1BadgeComponent {
  @Input() estado: BadgeEstado | string = '';
  @Input() label?: string;

  readonly claseMap: Record<string, string> = {
    PENDING:       'sp1-badge--danger',
    IN_PROGRESS:   'sp1-badge--warning',
    COMPLETED:     'sp1-badge--success',
    REJECTED:      'sp1-badge--neutral',
    DRAFT:         'sp1-badge--warning',
    PUBLISHED:     'sp1-badge--success',
    ARCHIVED:      'sp1-badge--neutral',
    ADMINISTRADOR: 'sp1-badge--danger',
    SUPERVISOR:    'sp1-badge--warning',
    FUNCIONARIO:   'sp1-badge--info',
    LOW:           'sp1-badge--neutral',
    MEDIUM:        'sp1-badge--info',
    HIGH:          'sp1-badge--warning',
    URGENT:        'sp1-badge--danger',
    ACTIVO:        'sp1-badge--success',
    INACTIVO:      'sp1-badge--neutral',
    ACTIVE:        'sp1-badge--warning',
    CANCELLED:     'sp1-badge--neutral',
    CRITICAL:      'sp1-badge--danger',
  };

  readonly iconMap: Record<string, string> = {
    PENDING:     'pi pi-clock',
    IN_PROGRESS: 'pi pi-spin pi-spinner',
    COMPLETED:   'pi pi-check-circle',
    REJECTED:    'pi pi-times-circle',
    DRAFT:       'pi pi-pencil',
    PUBLISHED:   'pi pi-check',
    ARCHIVED:    'pi pi-inbox',
    URGENT:      'pi pi-exclamation-triangle',
    ACTIVO:      'pi pi-check',
    INACTIVO:    'pi pi-ban',
  };

  get claseCSS(): string {
    return this.claseMap[this.estado] ?? 'badge--neutral';
  }

  get icono(): string {
    return this.iconMap[this.estado] ?? '';
  }

  get texto(): string {
    return this.label ?? ESTADO_LABELS[this.estado] ?? this.estado;
  }
}
