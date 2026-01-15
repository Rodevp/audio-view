import { Component, NgZone, ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-audio-view',
  imports: [],
  templateUrl: './audio-view.html',
  styleUrl: './audio-view.css',
})
export class AudioView {

  constructor(private ngZone: NgZone, private changeDetectorRef: ChangeDetectorRef) { }

  audioContext = new AudioContext();
  audioBuffer: AudioBuffer | null = null;
  sourceNode: AudioBufferSourceNode | null = null;
  analyzer!: AnalyserNode;
  frequencyData!: Uint8Array<ArrayBuffer>;
  isPlaying = false;

  barsCount = 28;
  svgWidth = 600;
  svgHeight = 200;
  bars: number[] = new Array(this.barsCount).fill(10);

  updateBars = () => {
    if (!this.frequencyData) return;

    const groupSize = Math.floor(this.frequencyData.length / this.barsCount);
    const newBars = new Array(this.barsCount);

    for (let i = 0; i < this.barsCount; i++) {
      let sum = 0;
      for (let j = 0; j < groupSize; j++) {
        sum += this.frequencyData[i * groupSize + j];
      }
      const value = sum / groupSize;
      newBars[i] = (value / 255) * this.svgHeight;
    }

    this.bars = newBars;

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
    console.log(this.frequencyData.slice(0, 10));
  }

  loop = () => {
    if (!this.isPlaying) return;

    this.readFrenquecyData();

    this.ngZone.run(() => {
      this.updateBars();
      this.changeDetectorRef.detectChanges();
    })

    requestAnimationFrame(this.loop);
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
    this.sourceNode.start();

    this.sourceNode.onended = () => {
      this.sourceNode = null;
      this.isPlaying = false;
    };

    this.isPlaying = true;

    this.loop();

  }

  stop = () => {
    if (!this.sourceNode) return;
    this.isPlaying = false;
    this.sourceNode.stop();
    this.sourceNode.disconnect();
    this.sourceNode = null;
  }

}
