import { Component, NgZone, ChangeDetectorRef } from '@angular/core';
import { AudioFrame, RadialPoint } from '../../types/audio';
import { Bars } from '../bars/bars';
import { Radial } from '../radial/radial';
import { Wave } from "../wave/wave";
import { UpdateGraphicsService } from '../../services/update-graphics';

@Component({
  selector: 'app-audio-view',
  imports: [Bars, Radial, Wave],
  templateUrl: './audio-view.html',
  styleUrl: './audio-view.css',
})
export class AudioView {

  constructor(
    private ngZone: NgZone,
    private changeDetectorRef: ChangeDetectorRef,
    private updateGraphicsService: UpdateGraphicsService
  ) { }

  audioContext = new AudioContext();
  audioBuffer: AudioBuffer | null = null;
  sourceNode: AudioBufferSourceNode | null = null;
  analyzer!: AnalyserNode;
  frequencyData!: Uint8Array<ArrayBuffer>;
  isPlaying = false;
  startTime = 0;
  pauseTime = 0;

  svgWidth = 600;
  svgHeight = 200;

  //bars config
  barsCount = 28;
  bars: number[] = new Array(this.barsCount).fill(10);

  //radial config
  radialPointsCount = 12;
  radialBaseRadius = 100;
  radialIntensity = 5;
  radialMaxOffset = 10;
  radialPoints: RadialPoint[] = [];

  //wave config
  waveformSamples = 64;        // cuántos puntos vamos a dibujar
  waveformAmplitude = 50;      // qué tanto sube y baja
  waveformCenterY = this.svgHeight / 2;
  wavePath = '';

  onFileCharge(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];

    console.log(file);

    if (!file) return;

    if (file.type.startsWith('audio/')) {
      file.arrayBuffer().then((buffer) => {

        this.audioContext.decodeAudioData(buffer).then((audioBuffer) => {
          this.audioBuffer = audioBuffer;
        });

      });

    } else {
      console.log("No es un archivo valido");
    }

  }

  readFrenquecyData = () => {
    if (!this.analyzer) return;
    this.analyzer.getByteFrequencyData(this.frequencyData);
  }

  loop = () => {
    if (!this.isPlaying) return;

    this.readFrenquecyData();
    const frame = this.createAudioFrame();

    this.ngZone.run(() => {
      console.log({ frame });
      this.bars = this.updateGraphicsService.updateBars(frame, { bars: this.bars, barsCount: this.barsCount, svgHeight: this.svgHeight });
      this.radialPoints = this.updateGraphicsService.updateRadial(frame, { radialBaseRadius: this.radialBaseRadius, radialIntensity: this.radialIntensity, radialMaxOffset: this.radialMaxOffset, radialPoints: this.radialPoints, svgWidth: this.svgWidth, svgHeight: this.svgHeight });
      this.wavePath = this.updateGraphicsService.updateWaveForm(frame, { waveformAmplitude: this.waveformAmplitude, waveformCenterY: this.waveformCenterY, waveformSamples: this.waveformSamples, svgWidth: this.svgWidth, wavePath: this.wavePath });
      this.changeDetectorRef.detectChanges();
    })

    requestAnimationFrame(this.loop);
  }

  createAudioFrame = (): AudioFrame | null => {

    /**
     * 
     * Creamos un fotograma del audio, esto nos va ayudar a jugar con la ui.
     * Ya que nos dice que datos hay por cada segundo del audio(fotograma).
     * 
     */


    if (!this.analyzer) return null;

    //leemos las frecuencias de nuestro audio
    const freqData = new Uint8Array(this.analyzer.frequencyBinCount);
    this.analyzer.getByteFrequencyData(freqData);

    //leemos los datos del tiempo de nuestro audio para jugar si queremos hacer ondas
    const timeData = new Uint8Array(this.analyzer.fftSize);
    this.analyzer.getByteTimeDomainData(timeData);

    const spectrum = Array.from(freqData, v => v / 255);
    const waveform = Array.from(timeData, v => (v - 128) / 128);

    //calculamos el promedio de las frecuencias para que nos diga cuan duro esta el sonido
    let energySum = 0;
    for (const v of spectrum) energySum += v;
    const energy = energySum / spectrum.length;

    const low = this.averageRange(spectrum, 0, 0.33); //graves
    const mid = this.averageRange(spectrum, 0.33, 0.66); //medios
    const high = this.averageRange(spectrum, 0.66, 1); //agudos

    return {
      time: this.audioContext.currentTime,
      spectrum,
      waveform,
      energy,
      bands: {
        low,
        mid,
        high
      }
    }

  }

  averageRange = (data: number[], from: number, to: number): number => {
    const start = Math.floor(data.length * from);
    const end = Math.floor(data.length * to);
    let sum = 0;

    for (let i = start; i < end; i++) {
      sum += data[i];
    }

    return sum / (end - start || 1);

  }

  playSound = () => {
    if (!this.audioBuffer) return;

    if (this.audioContext.state === "suspended") {
      this.audioContext.resume();
    }

    if (this.sourceNode) {
      this.stop();
    }

    this.analyzer = this.audioContext.createAnalyser();
    this.sourceNode = this.audioContext.createBufferSource();
    this.analyzer.fftSize = 256;

    this.frequencyData = new Uint8Array(this.analyzer.frequencyBinCount) as Uint8Array<ArrayBuffer>;

    //conectando "voltimetro(analyzer) a la bateria(sourceNode)"
    this.sourceNode.buffer = this.audioBuffer;
    this.sourceNode.connect(this.analyzer);
    this.analyzer.connect(this.audioContext.destination);

    this.startTime = this.audioContext.currentTime - this.pauseTime;
    this.sourceNode.start(0, this.pauseTime);

    this.sourceNode.onended = () => {
      this.sourceNode = null;
      this.isPlaying = false;
    };

    this.isPlaying = true;

    this.loop();

  }

  pauseSound = () => {
    if (!this.sourceNode) return;

    this.pauseTime = this.audioContext.currentTime - this.startTime;
    this.isPlaying = false;

    this.sourceNode.stop();
    this.sourceNode.disconnect();
    this.sourceNode = null;
  }

  stop = () => {
    if (!this.sourceNode) return;
    this.isPlaying = false;
    this.pauseTime = 0;
    this.sourceNode.stop();
    this.sourceNode.disconnect();
    this.sourceNode = null;
  }


}
