import { Injectable, signal } from "@angular/core";

@Injectable({
    providedIn: 'root'
})
export class AudioStore {
    audioContext = signal<AudioContext>(new AudioContext());
    audioBuffer = signal<AudioBuffer>(undefined!);
    analyzer = signal<AnalyserNode>(undefined!);
    sourceNode = signal<AudioBufferSourceNode | null>(null);
    frecuencyData = signal<Uint8Array<ArrayBuffer>>(undefined!);
    startTime = signal<number>(0);
    pauseTime = signal<number>(0);
}