/** WebSocket nativo con pool de conexiones lazy por topic. */
import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../auth/auth.service';

interface WsConnection {
  socket: WebSocket;
  messages$: Subject<unknown>;
  reconnectTimer?: ReturnType<typeof setTimeout>;
}

@Injectable({ providedIn: 'root' })
export class WebsocketService implements OnDestroy {
  private pool = new Map<string, WsConnection>();

  private get wsBase(): string {
    return environment.apiUrl
      .replace('/api', '')
      .replace(/^http/, 'ws');
  }

  constructor(
    private authService: AuthService,
    private ngZone: NgZone,
  ) {}

  /** No-op — conexiones son lazy en subscribe(). */
  connect(): void {}

  subscribe<T = unknown>(destination: string): Observable<T> {
    if (destination.startsWith('/app/')) {
      return new Observable<T>();
    }
    const conn = this.getOrCreate(destination);
    return conn.messages$ as Observable<T>;
  }

  publish(destination: string, body: unknown): void {
    if (destination.includes('/join') || destination.startsWith('/app/')) {
      return;
    }
    const conn = this.pool.get(destination);
    if (conn?.socket.readyState === WebSocket.OPEN) {
      conn.socket.send(JSON.stringify(body));
    }
  }

  disconnect(): void {
    this.pool.forEach(conn => {
      clearTimeout(conn.reconnectTimer);
      conn.socket.close();
    });
    this.pool.clear();
  }

  ngOnDestroy(): void {
    this.disconnect();
  }

  private getOrCreate(destination: string): WsConnection {
    if (this.pool.has(destination)) {
      return this.pool.get(destination)!;
    }
    const messages$ = new Subject<unknown>();
    const url = this.buildUrl(destination);
    const socket = this.openSocket(url, destination, messages$);
    const conn: WsConnection = { socket, messages$ };
    this.pool.set(destination, conn);
    return conn;
  }

  private buildUrl(destination: string): string {
    const token = this.authService.getToken();

    const canvas = destination.match(/^\/topic\/canvas\/(.+)$/);
    if (canvas) return `${this.wsBase}/ws/canvas/${canvas[1]}?token=${token}`;

    const tramite = destination.match(/^\/topic\/tramites\/(.+)$/);
    if (tramite) return `${this.wsBase}/ws/tramites/${tramite[1]}`;

    const tareas = destination.match(/^\/topic\/tareas\/(.+)$/);
    if (tareas) return `${this.wsBase}/ws/tareas/${tareas[1]}?token=${token}`;

    console.warn('[WebSocket] destination no reconocido:', destination);
    return `${this.wsBase}/ws${destination.replace('/topic', '')}`;
  }

  private openSocket(
    url: string,
    destination: string,
    messages$: Subject<unknown>,
  ): WebSocket {
    const ws = new WebSocket(url);

    ws.onopen = () => console.debug('[WebSocket] conectado →', destination);

    ws.onmessage = (event: MessageEvent) => {
      this.ngZone.run(() => {
        try {
          messages$.next(JSON.parse(event.data as string));
        } catch {
          console.error('[WebSocket] mensaje no es JSON:', event.data);
        }
      });
    };

    ws.onerror = (err) => console.error('[WebSocket] error en', destination, err);

    ws.onclose = (ev) => {
      console.debug('[WebSocket] cerrado', destination, ev.code);
      if (ev.code !== 1000 && this.pool.has(destination)) {
        const conn = this.pool.get(destination)!;
        conn.reconnectTimer = setTimeout(() => {
          if (!this.pool.has(destination)) return;
          conn.socket = this.openSocket(url, destination, messages$);
        }, 5000);
      }
    };

    return ws;
  }
}
