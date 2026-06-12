import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, map, switchMap } from 'rxjs';

import {
  Politica, DiagramaCompleto, VersionPolitica, Calle, NodoUML,
} from '../../../shared/models/politica.model';
import {
  IniciarTramiteRequest, IniciarTramiteResponse, Tramite,
} from '../../../shared/models/tramite.model';
import { environment } from '../../../../environments/environment';

/** Respuesta del backend GET /policies/{id}/versions/{vId}/diagram */
interface DiagramaRaw {
  version?: VersionPolitica & { calles?: Calle[] };
  calles?: Calle[];
  nodos?: NodoUML[];
}

@Injectable({ providedIn: 'root' })
export class TramiteService {

  private readonly BASE = `${environment.apiUrl}`;

  private politicasSubject = new BehaviorSubject<Politica[]>([]);
  private loadingSubject   = new BehaviorSubject<boolean>(false);

  politicas$ = this.politicasSubject.asObservable();
  loading$   = this.loadingSubject.asObservable();

  constructor(private http: HttpClient) {}

  // ── Politicas publicadas ─────────────────────────────────────────────────────

  cargarPoliticasPublicadas(): void {
    this.loadingSubject.next(true);
    this.http.get<Politica[]>(`${this.BASE}/policies`).subscribe({
      next: all => {
        const publicadas = all.filter(p => p.estado === 'PUBLISHED');
        this.politicasSubject.next(publicadas);
        this.loadingSubject.next(false);
      },
      error: () => this.loadingSubject.next(false),
    });
  }

  obtenerPolitica(id: string): Observable<Politica> {
    return this.http.get<Politica>(`${this.BASE}/policies/${id}`);
  }

  obtenerDiagramaPublicado(politicaId: string): Observable<DiagramaCompleto> {
    return this.http
      .get<VersionPolitica[]>(`${this.BASE}/policies/${politicaId}/versions`)
      .pipe(
        map(versiones => {
          const pub = versiones
            .filter(v => v.estado === 'PUBLISHED')
            .sort((a, b) => b.numeroVersion - a.numeroVersion)[0];
          if (!pub) throw new Error('No hay version publicada');
          return pub;
        }),
        switchMap(version =>
          this.http.get<DiagramaRaw>(
            `${this.BASE}/policies/${politicaId}/versions/${version.id}/diagram`,
          ).pipe(
            map(resp => ({
              version: resp.version ?? version,
              calles:  resp.version?.calles ?? resp.calles ?? [],
              nodos:   resp.nodos ?? [],
            } as DiagramaCompleto)),
          ),
        ),
      );
  }

  // ── Tramites ─────────────────────────────────────────────────────────────────

  iniciarTramite(body: IniciarTramiteRequest): Observable<IniciarTramiteResponse> {
    return this.http.post<IniciarTramiteResponse>(`${this.BASE}/tramites`, body);
  }

  /** @deprecated Usar MonitorService.obtenerTramite() — misma lógica, fuente única. */
  obtenerTramite(id: string): Observable<Tramite> {
    return this.http.get<Tramite>(`${this.BASE}/tramites/${id}`);
  }
}
