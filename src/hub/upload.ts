import type { Mesh, Object3D, ShaderMaterial, Texture } from 'three-hub';

/** Uploads every picture in the scene to the graphics card now, behind the loader, instead of the
 *  first time it comes into view (a first upload stalled scrolling for about a second). */
export function uploadAll(renderer: { initTexture(t: Texture): void }, root: Object3D) {
  const seen = new Set<Texture>();
  const take = (v: unknown) => {
    const t = v as Texture & { isVideoTexture?: boolean };
    if (t && (t as Texture).isTexture && !t.isVideoTexture && !seen.has(t)) {
      seen.add(t);
      renderer.initTexture(t);
    }
  };
  root.traverse((o) => {
    const m = (o as Mesh).material;
    const mats = Array.isArray(m) ? m : m ? [m] : [];
    for (const mat of mats) {
      for (const v of Object.values(mat)) take(v);
      const u = (mat as ShaderMaterial).uniforms;
      if (u) for (const x of Object.values(u)) take(x.value);
    }
  });
  return seen.size;
}
