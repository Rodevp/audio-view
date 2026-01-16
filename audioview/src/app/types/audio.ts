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

type RadialPoint = {
    x: number;
    y: number;
    angle: number;
}

type RadialConfig = {
    svgWidth: number;
    svgHeight: number;
    radialBaseRadius: number;
    radialIntensity: number;
    radialMaxOffset: number;
    radialPoints: RadialPoint[];
}

type WaveFormConfig = {
    svgWidth: number;
    waveformSamples: number;
    waveformAmplitude: number;
    waveformCenterY: number;
    wavePath: string;
}

type BarConfig = {
    svgHeight: number;
    barsCount: number;
    bars: number[];
}

export type {
    AudioFrame,
    RadialConfig,
    BarConfig,
    WaveFormConfig,
    RadialPoint
};
