/*
 * Servicio de reconocimiento de voz via Web Speech API (browser-native).
 * Solo disponible en Chrome/Edge. Emite texto transcrito a través de Observables.
 *
 * Tipado: la Web Speech API no está en el estándar TypeScript DOM lib aún,
 * pero existe como propuesta WICG. Declaramos la interfaz mínima necesaria
 * para eliminar todos los `any`.
 */

import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

// ── Tipos Web Speech API ──────────────────────────────────────────────────────
// TypeScript no incluye estos tipos en la lib DOM estándar todavía.
// Declaramos solo los campos que usamos.

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognitionResult {
  readonly length: number;
  readonly isFinal: boolean;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEvent extends Event {
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  /** Tipo de error: 'no-speech' | 'aborted' | 'audio-capture' | 'network' | ... */
  readonly error: string;
}

/** Instancia de SpeechRecognition creada con `new SR()` */
interface SpeechRecognitionInstance extends EventTarget {
  lang:            string;
  continuous:      boolean;
  interimResults:  boolean;
  onresult:        ((event: SpeechRecognitionEvent) => void) | null;
  onend:           (() => void) | null;
  onerror:         ((event: SpeechRecognitionErrorEvent) => void) | null;
  start():  void;
  stop():   void;
  abort():  void;
}

/** Constructor de SpeechRecognition (varía entre navegadores) */
interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionInstance;
}

/** Extiende Window solo en este archivo para evitar contaminación global */
interface WindowWithSpeechRecognition extends Window {
  SpeechRecognition?:        SpeechRecognitionConstructor;
  webkitSpeechRecognition?:  SpeechRecognitionConstructor;
}

// ── Servicio ──────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class MicrophoneService {

  /** Emite la transcripción acumulada mientras el micrófono está activo. */
  readonly transcript$ = new Subject<string>();

  /** Emite true cuando se inicia la grabación, false cuando se detiene. */
  readonly active$ = new Subject<boolean>();

  readonly isSupported: boolean;

  private recognition: SpeechRecognitionInstance | null = null;

  constructor() {
    const w = window as WindowWithSpeechRecognition;
    this.isSupported = !!(w.SpeechRecognition || w.webkitSpeechRecognition);
  }

  start(): void {
    if (!this.isSupported) return;

    const w = window as WindowWithSpeechRecognition;
    const SR = w.SpeechRecognition ?? w.webkitSpeechRecognition!;
    this.recognition = new SR();

    this.recognition.lang            = 'es-ES';
    this.recognition.continuous      = true;
    this.recognition.interimResults   = true;

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      let transcript = '';
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      this.transcript$.next(transcript);
    };

    this.recognition.onend = () => this.active$.next(false);

    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      this.active$.next(false);
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        // El componente decide cómo mostrar el error
        this.transcript$.error(new Error(event.error));
      }
    };

    this.recognition.start();
    this.active$.next(true);
  }

  stop(): void {
    this.recognition?.stop();
    this.active$.next(false);
  }

  abort(): void {
    this.recognition?.abort();
    this.active$.next(false);
  }
}
