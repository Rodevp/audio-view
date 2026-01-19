import { Component, NgZone, ChangeDetectorRef, inject } from '@angular/core';
import { RadialPoint } from '../../types/audio';

import { Bars } from '../bars/bars';
import { Radial } from '../radial/radial';
import { Wave } from "../wave/wave";
import { ActionButton } from '../action-button/action-button';

import { UpdateGraphicsService } from '../../services/update-graphics';
import { AudioStore } from '../../store/audio';
import { AudioService } from '../../services/audio';
/**
 * 2 espacios
 * 
 * crear componente para los controles (pausa, play, stop).
 * 
 * crear funcionalidad para intencambiar de grafico en tiempo real.
 *  
 */


@Component({
  selector: 'app-audio-view',
  imports: [Bars, ActionButton],
  templateUrl: './audio-view.html',
  styleUrl: './audio-view.css',
})
export class AudioView {

  audioStore = inject(AudioStore);
  audioService = inject(AudioService);
  ngZone = inject(NgZone);
  changeDetectorRef = inject(ChangeDetectorRef);
  updateGraphicsService = inject(UpdateGraphicsService);

  isPlaying = false;

  svgWidth = 600;
  svgHeight = 200;

  //bars config
  barsCount = 8;
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

        this.audioStore.audioContext()!.decodeAudioData(buffer).then((audioBuffer) => {
          this.audioStore.audioBuffer.set(audioBuffer);
        });

      });

    } else {
      console.log("No es un archivo valido");
    }

  }

  readFrenquecyData = () => {
    if (!this.audioStore.analyzer()) return;
    this.audioStore.analyzer()!.getByteFrequencyData(this.audioStore.frecuencyData()!);
  }

  loop = () => {
    if (!this.isPlaying) return;

    this.readFrenquecyData();
    const frame = this.audioService.createAudioFrame();

    this.ngZone.run(() => {
      console.log({ frame });
      this.bars = this.updateGraphicsService.updateBars(frame, { bars: this.bars, barsCount: this.barsCount, svgHeight: this.svgHeight });
      this.radialPoints = this.updateGraphicsService.updateRadial(frame, { radialBaseRadius: this.radialBaseRadius, radialIntensity: this.radialIntensity, radialMaxOffset: this.radialMaxOffset, radialPoints: this.radialPoints, svgWidth: this.svgWidth, svgHeight: this.svgHeight });
      this.wavePath = this.updateGraphicsService.updateWaveForm(frame, { waveformAmplitude: this.waveformAmplitude, waveformCenterY: this.waveformCenterY, waveformSamples: this.waveformSamples, svgWidth: this.svgWidth, wavePath: this.wavePath });
      this.changeDetectorRef.detectChanges();
    })

    requestAnimationFrame(this.loop);
  }

  playSound = () => {
    this.audioService.playSound();
    this.isPlaying = true;
    this.loop();
  }

  pauseSound = () => {
    this.audioService.pauseSound();
    this.isPlaying = false;
  }

  stop = () => {
    this.audioService.stop();
    this.isPlaying = false;
    this.audioStore.pauseTime.set(0);
  }

}
