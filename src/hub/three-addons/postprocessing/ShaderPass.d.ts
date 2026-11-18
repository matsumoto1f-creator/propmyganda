export class ShaderPass {
  constructor(shader: object, textureID?: string);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  uniforms: Record<string, { value: any }>;
}
