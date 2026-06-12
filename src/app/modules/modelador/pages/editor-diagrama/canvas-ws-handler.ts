/**
 * Lógica de manejo de eventos WebSocket del canvas colaborativo.
 * Función pura — no depende de ningún servicio Angular directamente;
 * recibe las dependencias como parámetros para facilitar el testing.
 */

import { MessageService } from 'primeng/api';
import { Observable, Subject, takeUntil } from 'rxjs';
import { DiagramaService } from '../../services/diagrama.service';
import { PoliticaService } from '../../services/politica.service';
import {
  AdminPresenciaInfo, Calle, CanvasWsEnvelope, NodoUML, VersionPolitica, Politica,
} from '../../../../shared/models/politica.model';

export interface CanvasWsContext {
  diagramaService:      DiagramaService;
  politicaService:      PoliticaService;
  messageService:       MessageService;
  destroy$:             Subject<void>;
  getVersionActiva:     () => VersionPolitica | null;
  getPolitica:          () => Politica | null;
  setPresencia:         (lista: AdminPresenciaInfo[]) => void;
  getPresencia:         () => AdminPresenciaInfo[];
  onPoliticaPublicada?: () => void;
}

export function handleCanvasWsEvent(
  env: CanvasWsEnvelope,
  miEmail: string,
  ctx: CanvasWsContext,
): void {
  const { tipo, adminEmail, payload } = env;
  const esPropio = adminEmail === miEmail;
  const { diagramaService, politicaService, messageService } = ctx;

  switch (tipo) {

    case 'NODO_CREADO': {
      const nodo = payload as NodoUML;
      const existe = diagramaService.getEstadoSnapshot().nodos.some(n => n.nodoId === nodo.nodoId);
      if (!existe) diagramaService.agregarNodoEnEstado(nodo);
      break;
    }

    case 'NODO_ACTUALIZADO':
    case 'NODO_CONFIGURADO': {
      if (esPropio) break;
      diagramaService.actualizarNodoEnEstado(payload as NodoUML);
      break;
    }

    case 'NODO_ELIMINADO': {
      if (esPropio) break;
      diagramaService.eliminarNodoDeEstado((payload as { nodoId: string }).nodoId);
      break;
    }

    case 'CONEXION_CREADA': {
      if (esPropio) break;
      diagramaService.actualizarNodoEnEstado(payload as NodoUML);
      break;
    }

    case 'CONEXION_ELIMINADA': {
      if (esPropio) break;
      const { nodoOrigenId, nodoDestinoId } = payload as { nodoOrigenId: string; nodoDestinoId: string };
      diagramaService.quitarConexionEnEstado(nodoOrigenId, nodoDestinoId);
      break;
    }

    case 'CALLE_CREADA': {
      if (esPropio) break;
      diagramaService.agregarCalleEnEstado(payload as Calle);
      break;
    }

    case 'CALLE_ACTUALIZADA': {
      if (esPropio) break;
      diagramaService.actualizarCalleEnEstado(payload as Calle);
      break;
    }

    case 'CALLE_ELIMINADA': {
      if (esPropio) break;
      diagramaService.eliminarCalleDeEstado((payload as { calleId: string }).calleId);
      break;
    }

    case 'ADMIN_JOINED': {
      const { activos } = payload as { nuevo: AdminPresenciaInfo; activos: AdminPresenciaInfo[] };
      ctx.setPresencia(activos.filter(a => a.email !== miEmail));
      break;
    }

    case 'ADMIN_LEFT': {
      const saliente = payload as AdminPresenciaInfo;
      ctx.setPresencia(ctx.getPresencia().filter(a => a.email !== saliente.email));
      break;
    }

    case 'DIAGRAMA_GENERADO_IA': {
      if (esPropio) break;
      const versionActiva = ctx.getVersionActiva();
      const politica      = ctx.getPolitica();
      if (!politica || !versionActiva) break;
      politicaService
        .obtenerDiagrama(politica.id, versionActiva.id)
        .pipe(takeUntil(ctx.destroy$))
        .subscribe({
          next: diagrama => {
            diagramaService.inicializar(versionActiva.id, diagrama.nodos ?? [], diagrama.calles ?? []);
            messageService.add({
              severity: 'info', summary: 'Diagrama actualizado',
              detail: 'Otro administrador regeneró el diagrama con IA.', life: 4000,
            });
          },
        });
      break;
    }

    case 'POLITICA_PUBLICADA': {
      ctx.onPoliticaPublicada?.();
      messageService.add({
        severity: 'info', summary: 'Política publicada',
        detail: 'La política fue publicada. El canvas pasó a modo solo lectura.', life: 5000,
      });
      break;
    }

    // El backend emite PRESENCE_UPDATE con {tipo, usuarios:[]} cuando alguien entra/sale
    case 'PRESENCE_UPDATE' as any: {
      const { usuarios } = env as any;
      if (Array.isArray(usuarios)) {
        ctx.setPresencia((usuarios as AdminPresenciaInfo[]).filter(a => a.email !== miEmail));
      }
      break;
    }
  }
}
