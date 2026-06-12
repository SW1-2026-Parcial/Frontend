import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface CriteriosReporte {
  titulo: string;
  formato: 'EXCEL' | 'WORD';
  estado: string | null;
  departamentoId: string | null;
  politicaId: string | null;
  fechaDesde: string | null;
  fechaHasta: string | null;
  columnas: string[];
  ordenarPor: string;
}

export interface ParsearPromptResponse {
  criterios: CriteriosReporte;
  valido: boolean;
  advertencias: string[];
}

export interface ReporteChatResponse {
  mensaje: string;
  criterios: CriteriosReporte | null;
  listo: boolean;
  camposFaltantes: string[];
  sessionId: string;
}

@Injectable({ providedIn: 'root' })
export class ReporteService {
  private readonly BASE = `${environment.apiUrl}/reportes`;

  constructor(private http: HttpClient) {}

  chat(mensaje: string, sessionId: string | null): Observable<ReporteChatResponse> {
    return this.http.post<ReporteChatResponse>(`${this.BASE}/chat`, {
      mensaje,
      sessionId,
    });
  }

  clearSession(sessionId: string): Observable<void> {
    return this.http.post<void>(`${this.BASE}/chat/clear`, { sessionId });
  }

  parsearPrompt(prompt: string): Observable<ParsearPromptResponse> {
    return this.http.post<ParsearPromptResponse>(`${this.BASE}/parse-prompt`, { prompt });
  }

  /**
   * Genera el reporte y dispara descarga automática del archivo.
   * Retorna Observable para que el consumidor controle loading/errores.
   */
  generarReporte(criterios: CriteriosReporte): Observable<Blob> {
    return this.http
      .post(`${this.BASE}/generar`, { criterios }, { responseType: 'blob' })
      .pipe(
        tap(blob => {
          const extension = criterios.formato === 'WORD' ? 'docx' : 'xlsx';
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `reporte_${new Date().toISOString().slice(0, 10)}.${extension}`;
          a.click();
          window.URL.revokeObjectURL(url);
        }),
      );
  }
}
