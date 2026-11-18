import type { WebGLRenderer } from 'three-hub';
export class EffectComposer {
  constructor(renderer: WebGLRenderer);
  addPass(pass: object): void;
  render(deltaTime?: number): void;
  setSize(width: number, height: number): void;
  setPixelRatio(pixelRatio: number): void;
  dispose(): void;
}
