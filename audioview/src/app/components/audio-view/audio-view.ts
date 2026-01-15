import { Component } from '@angular/core';

@Component({
  selector: 'app-audio-view',
  imports: [],
  templateUrl: './audio-view.html',
  styleUrl: './audio-view.css',
})
export class AudioView {

  audioContext = new AudioContext();
  audioBuffer: AudioBuffer | null = null;
  sourceNode: AudioBufferSourceNode | null = null;
  analyzer!: AnalyserNode;
  frequencyData!: Uint8Array<ArrayBuffer>;


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
    if (!this.sourceNode) return;

    this.readFrenquecyData();
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

    this.sourceNode.buffer = this.audioBuffer;
    this.sourceNode.connect(this.analyzer);
    this.analyzer.connect(this.audioContext.destination);
    this.sourceNode.start();

    this.sourceNode.onended = () => {
      this.sourceNode = null;
    };

    this.loop();

  }

  stop = () => {
    if (!this.sourceNode) return;
    this.sourceNode.stop();
    this.sourceNode.disconnect();
    this.sourceNode = null;
  }

}
