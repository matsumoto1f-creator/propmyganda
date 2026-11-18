import type { Vector2 } from 'three-hub';
export class UnrealBloomPass {
  constructor(resolution: Vector2, strength: number, radius: number, threshold: number);
  resolution: Vector2;
  strength: number;
  radius: number;
  threshold: number;
}
