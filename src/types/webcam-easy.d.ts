declare module 'webcam-easy' {
  export class Webcam {
    constructor(webcamElement: HTMLVideoElement, facingMode?: string, canvasElement?: HTMLCanvasElement, snapSoundElement?: HTMLAudioElement);
    start(startStream?: boolean): Promise<string>;
    stop(): void;
    stream(): MediaStream | null;
    snap(): string;
    flip(): void;
    facingMode: string;
  }
}
