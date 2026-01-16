import { Injectable } from "@angular/core";
import { AudioFrame, BarConfig, RadialConfig, WaveFormConfig } from "../types/audio";


@Injectable({
    providedIn: 'root'
})
export class UpdateGraphicsService {

    updateRadial = (frame: AudioFrame | null, radialConfig: RadialConfig) => {
        const centerX = radialConfig.svgWidth / 2;
        const centerY = radialConfig.svgHeight / 2;

        const dynamicRadius = radialConfig.radialBaseRadius + (frame?.bands.low! * radialConfig.radialIntensity * radialConfig.radialMaxOffset);

        radialConfig.radialPoints = radialConfig.radialPoints.map(p => (
            {
                ...p,
                x: centerX + Math.cos(p.angle) * dynamicRadius,
                y: centerY + Math.sin(p.angle) * dynamicRadius
            }
        ))

        return radialConfig.radialPoints;

    }

    updateBars = (frame: AudioFrame | null, barConfig: BarConfig) => {
        barConfig.bars = frame?.spectrum
            .slice(0, barConfig.barsCount)
            .map(v => v * barConfig.svgHeight) || [];

        return barConfig.bars;
    }

    updateWaveForm = (frame: AudioFrame | null, waveFormConfig: WaveFormConfig) => {
        const samples = frame?.waveform;
        const step = Math.floor(samples!.length / waveFormConfig.waveformSamples);
        const stepX = waveFormConfig.svgWidth / (waveFormConfig.waveformSamples - 1);

        let path = '';

        for (let i = 0; i < waveFormConfig.waveformSamples; i++) {
            const sample = samples![i * step];
            const x = i * stepX;
            const y = waveFormConfig.waveformCenterY + sample * waveFormConfig.waveformAmplitude;

            if (i === 0) {
                path += `M ${x} ${y}`;
            } else {
                path += `L ${x} ${y}`;
            }

        }

        waveFormConfig.wavePath = path;

        return waveFormConfig.wavePath;
    }


}