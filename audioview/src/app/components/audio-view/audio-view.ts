import { Component, NgZone, ChangeDetectorRef, OnInit } from '@angular/core';
import { AudioFrame } from '../../types/audio';

@Component({
  selector: 'app-audio-view',
  imports: [],
  templateUrl: './audio-view.html',
  styleUrl: './audio-view.css',
})
export class AudioView implements OnInit {

  constructor(private ngZone: NgZone, private changeDetectorRef: ChangeDetectorRef) { }

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
  radialPoints: { x: number, y: number, angle: number }[] = [];

  //wave config
  waveformSamples = 64;        // cuántos puntos vamos a dibujar
  waveformAmplitude = 50;      // qué tanto sube y baja
  waveformCenterY = this.svgHeight / 2;
  wavePath = '';

  initRadial = () => {
    this.radialPoints = [];

    const centerX = this.svgWidth / 2;
    const centerY = this.svgHeight / 2;

    for (let i = 0; i < this.radialPointsCount; i++) {
      const angle = (Math.PI * 2 / this.radialPointsCount) * i;

      const x = centerX + Math.cos(angle) * this.radialBaseRadius;
      const y = centerY + Math.sin(angle) * this.radialBaseRadius;

      this.radialPoints.push({ x, y, angle });
    }

  }

  updateRadial = (frame: AudioFrame | null) => {
    const centerX = this.svgWidth / 2;
    const centerY = this.svgHeight / 2;

    const dynamicRadius = this.radialBaseRadius + (frame?.bands.low! * this.radialIntensity * this.radialMaxOffset);

    this.radialPoints = this.radialPoints.map(p => (
      {
        ...p,
        x: centerX + Math.cos(p.angle) * dynamicRadius,
        y: centerY + Math.sin(p.angle) * dynamicRadius
      }
    ))

  }

  updateBars = (frame: AudioFrame | null) => {
    this.bars = frame?.spectrum
      .slice(0, this.barsCount)
      .map(v => v * this.svgHeight) || [];
  }

  updateWaveForm = (frame: AudioFrame | null) => {
    const samples = frame?.waveform;
    const step = Math.floor(samples!.length / this.waveformSamples);
    const stepX = this.svgWidth / (this.waveformSamples - 1);

    let path = '';

    for (let i = 0; i < this.waveformSamples; i++) {
      const sample = samples![i * step];
      const x = i * stepX;
      const y = this.waveformCenterY + sample * this.waveformAmplitude;

      if (i === 0) {
        path += `M ${x} ${y}`;
      } else {
        path += `L ${x} ${y}`;
      }

    }

    this.wavePath = path;

  }

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
      this.updateBars(frame);
      this.updateRadial(frame);
      this.updateWaveForm(frame);
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

  ngOnInit(): void {
    this.initRadial();
  }

}
