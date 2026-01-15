type AudioFrame = {
    time: number;
    spectrum: number[];
    waveform: number[];
    energy: number;
    bands: {
        low: number;
        mid: number;
        high: number;
    }
}

export type { AudioFrame };