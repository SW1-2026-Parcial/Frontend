import { Component, ViewChild, ElementRef, AfterViewChecked, ChangeDetectorRef } from '@angular/core';
import { MessageService } from 'primeng/api';
import {
  ReporteService,
  CriteriosReporte,
  ReporteChatResponse,
} from '../../../../core/services/reporte.service';

interface ChatMensaje {
  rol: 'user' | 'assistant' | 'system';
  texto: string;
  criterios?: CriteriosReporte | null;
  listo?: boolean;
  timestamp: Date;
}

@Component({
  selector: 'app-generar-reporte',
  standalone: false,
  templateUrl: './generar-reporte.component.html',
  styleUrls: ['./generar-reporte.component.scss'],
  providers: [MessageService],
})
export class GenerarReporteComponent implements AfterViewChecked {

  @ViewChild('chatEnd') private chatEndRef!: ElementRef;

  mensajes: ChatMensaje[] = [
    {
      rol: 'assistant',
      texto: '¡Hola! Soy el asistente de reportes. Describime qué información necesitás y lo genero en **Excel** o **Word**.\n\nPodés decirme cosas como:\n• "Los trámites completados del mes pasado en Excel"\n• "Trámites activos con prioridad alta"\n• "Todo lo rechazado de este año en Word"',
      timestamp: new Date(),
    },
  ];

  inputText = '';
  loading = false;
  generando = false;

  private sessionId: string | null = null;
  private shouldScroll = false;

  constructor(
    private reporteService: ReporteService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      this.chatEndRef?.nativeElement.scrollIntoView({ behavior: 'smooth' });
      this.shouldScroll = false;
    }
  }

  // Timeout de 60s — si la IA no responde, desbloquear el chat
  private loadingTimeout?: ReturnType<typeof setTimeout>;

  enviar(): void {
    const texto = this.inputText.trim();
    if (!texto || this.loading) return;

    // Agregar mensaje del usuario inmediatamente
    this.mensajes = [...this.mensajes, { rol: 'user', texto, timestamp: new Date() }];
    this.inputText = '';
    this.loading = true;
    this.shouldScroll = true;
    this.cdr.detectChanges();

    // Timeout de seguridad: si la IA no responde en 60s, desbloquear
    this.loadingTimeout = setTimeout(() => {
      if (this.loading) {
        this.loading = false;
        this.mensajes = [...this.mensajes, {
          rol: 'assistant',
          texto: 'La IA tardó demasiado en responder. Intenta de nuevo.',
          timestamp: new Date(),
        }];
        this.shouldScroll = true;
        this.cdr.detectChanges();
      }
    }, 60_000);

    this.reporteService.chat(texto, this.sessionId).subscribe({
      next: (res) => {
        clearTimeout(this.loadingTimeout);
        this.loading = false;
        this.sessionId = res.sessionId;
        this.mensajes = [...this.mensajes, {
          rol: 'assistant',
          texto: res.mensaje,
          criterios: res.criterios,
          listo: res.listo,
          timestamp: new Date(),
        }];
        this.shouldScroll = true;
        this.cdr.detectChanges();
      },
      error: (err) => {
        clearTimeout(this.loadingTimeout);
        console.error('Error en chat de reportes:', err);
        this.loading = false;
        this.mensajes = [...this.mensajes, {
          rol: 'assistant',
          texto: 'Hubo un error de conexión. Verificá que el backend esté corriendo e intentá de nuevo.',
          timestamp: new Date(),
        }];
        this.shouldScroll = true;
        this.cdr.detectChanges();
      },
    });
  }

  generarReporte(criterios: CriteriosReporte): void {
    this.generando = true;
    this.mensajes = [...this.mensajes, {
      rol: 'system',
      texto: `Generando reporte "${criterios.titulo}" en ${criterios.formato}...`,
      timestamp: new Date(),
    }];
    this.shouldScroll = true;
    this.cdr.detectChanges();

    this.reporteService.generarReporte(criterios).subscribe({
      next: () => {
        this.generando = false;
        this.mensajes = [...this.mensajes, {
          rol: 'assistant',
          texto: 'Reporte generado. La descarga comenzo automaticamente.\n\n¿Necesitas algun cambio o queres otro reporte?',
          timestamp: new Date(),
        }];
        this.shouldScroll = true;
        this.cdr.detectChanges();
      },
      error: () => {
        this.generando = false;
        this.mensajes = [...this.mensajes, {
          rol: 'assistant',
          texto: 'Error al generar el reporte. Intenta de nuevo.',
          timestamp: new Date(),
        }];
        this.shouldScroll = true;
        this.cdr.detectChanges();
      },
    });
  }

  nueva(): void {
    if (this.sessionId) {
      this.reporteService.clearSession(this.sessionId).subscribe();
    }
    this.mensajes = [this.mensajes[0]];
    this.inputText = '';
    this.sessionId = null;
  }
}
