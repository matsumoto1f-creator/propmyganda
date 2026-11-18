import { type Camera, Object3D, type Scene } from 'three-hub';
export class CSS3DObject extends Object3D {
  constructor(element?: HTMLElement);
  element: HTMLElement;
}
export class CSS3DRenderer {
  constructor();
  domElement: HTMLElement;
  setSize(width: number, height: number): void;
  render(scene: Scene, camera: Camera): void;
}
