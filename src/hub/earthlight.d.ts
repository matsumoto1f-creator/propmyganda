// The surface of vendor/earthlight/pmg-backdrop.ts that the hub uses (Earthlight, MIT). Declared
// here so the type check does not walk the vendored renderer.
declare module 'earthlight-backdrop' {
  export interface BackdropView {
    lat: number;
    lon: number;
    altitudeKm: number;
    heading: number;
    tilt: number;
    roll: number;
    lens: number;
    epoch: string;
  }
  export const CORNER_NIGHT: Omit<BackdropView, 'lat' | 'lon' | 'heading'>;
  export const NYC: { lat: number; lon: number };
  export function aimView(
    base: Omit<BackdropView, 'lat' | 'lon' | 'heading'>,
    target: { lat: number; lon: number },
    at: [number, number],
    aspect: number,
    approach: number,
  ): BackdropView;
  export type BackdropStatus = 'probing' | 'loading' | 'live' | 'unavailable';
  export interface EarthBackdrop {
    status(): BackdropStatus;
    paint(seconds: number, yaw: number, pitch: number, now?: number): boolean;
    focus(): number;
    setView(view: BackdropView): void;
    resize(): void;
    dispose(): void;
  }
  export function createEarthBackdrop(
    canvas: HTMLCanvasElement,
    opts: {
      assetBase: string;
      view: BackdropView;
      allowSoftware?: boolean;
      timeScale?: number;
      maxScale?: number;
      aurora?: boolean;
      spin?: number;
      moonScale?: number;
      exposureEV?: number | null;
    },
  ): EarthBackdrop;
}
