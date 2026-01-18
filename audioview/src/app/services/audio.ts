import { inject, Injectable } from "@angular/core";
import { AudioFrame } from "../types/audio";
import { AudioStore } from "../store/audio";
import { averageRange } from "../utils/audio";

@Injectable({
    providedIn: 'root'
})
export class AudioService {

    audioStore = inject(AudioStore);

    createAudioFrame = (): AudioFrame | null => {

        /**
         * 
         * Creamos un fotograma del audio, esto nos va ayudar a jugar con la ui.
         * Ya que nos dice que datos hay por cada segundo del audio(fotograma).
         * 
         */

        if (!this.audioStore.analyzer()) return null;

        //leemos las frecuencias de nuestro audio
        const freqData = new Uint8Array(this.audioStore.analyzer()!.frequencyBinCount);
        this.audioStore.analyzer()!.getByteFrequencyData(freqData);

        //leemos los datos del tiempo de nuestro audio para jugar si queremos hacer ondas
        const timeData = new Uint8Array(this.audioStore.analyzer()!.fftSize);
        this.audioStore.analyzer()!.getByteTimeDomainData(timeData);

        const spectrum = Array.from(freqData, v => v / 255);
        const waveform = Array.from(timeData, v => (v - 128) / 128);

        //calculamos el promedio de las frecuencias para que nos diga cuan duro esta el sonido
        let energySum = 0;
        for (const v of spectrum) energySum += v;
        const energy = energySum / spectrum.length;

        const low = averageRange(spectrum, 0, 0.33); //graves
        const mid = averageRange(spectrum, 0.33, 0.66); //medios
        const high = averageRange(spectrum, 0.66, 1); //agudos

        return {
            time: this.audioStore.audioContext()!.currentTime,
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

    playSound = () => {
        if (!this.audioStore.audioBuffer()) return;

        if (this.audioStore.audioContext()!.state === "suspended") {
            this.audioStore.audioContext()!.resume();
        }

        if (this.audioStore.sourceNode()) {
            this.stop();
        }

        this.audioStore.analyzer.set(this.audioStore.audioContext()?.createAnalyser()!);
        this.audioStore.sourceNode.set(this.audioStore.audioContext()?.createBufferSource()!);
        this.audioStore.analyzer()!.fftSize = 256;

        this.audioStore.frecuencyData.set(new Uint8Array(this.audioStore.analyzer()!.frequencyBinCount));

        //conectando "voltimetro(analyzer) a la bateria(sourceNode)"
        this.audioStore.sourceNode()!.buffer = this.audioStore.audioBuffer();
        this.audioStore.sourceNode()?.connect(this.audioStore.analyzer()!);
        this.audioStore.analyzer()?.connect(this.audioStore.audioContext()!.destination);

        this.audioStore.startTime.set(this.audioStore.audioContext()!.currentTime - this.audioStore.pauseTime());
        this.audioStore.sourceNode()!.start(0, this.audioStore.pauseTime());

        this.audioStore.sourceNode()!.onended = () => {
            this.audioStore.sourceNode.set(null);
        };

    }

    pauseSound = () => {
        if (!this.audioStore.sourceNode()) return;

        this.audioStore.pauseTime.set(this.audioStore.audioContext()!.currentTime - this.audioStore.startTime());

        this.audioStore.sourceNode()!.stop();
        this.audioStore.sourceNode()!.disconnect();
        this.audioStore.sourceNode.set(null);
    }

    stop = () => {
        if (!this.audioStore.sourceNode()) return;
        this.audioStore.pauseTime.set(0);
        this.audioStore.sourceNode()!.stop();
        this.audioStore.sourceNode()!.disconnect();
        this.audioStore.sourceNode.set(null);
    }
}