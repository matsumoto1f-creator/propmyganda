// The kinetic image column: PMG's own covers, reel posters and visualizer stills, laid side by
// side on one canvas and wrapped around a stack of open cylinders at the heart of the tower, with
// thin type bands between them. Nothing spins: each cylinder slides its picture around itself, so
// the motion costs one number per cylinder. Method from the public Codrops tutorial on kinetic
// image animation (Fojcik, 2025): a canvas collage on cylinders, offset not rotation. Our own
// material, layout, type and motion.
import {
  CanvasTexture,
  ClampToEdgeWrapping,
  CylinderGeometry,
  DoubleSide,
  Group,
  LinearMipmapLinearFilter,
  Mesh,
  MeshBasicMaterial,
  RepeatWrapping,
  SRGBColorSpace,
  type Texture,
} from 'three-hub';

type Picture = CanvasImageSource & { width: number; height: number };

export interface Kinetic {
  group: Group;
  textures: Texture[];
  update(scroll: number, time: number): void;
  /** 0..1: how bright the column is (lower while a screen is in focus). */
  setLevel(level: number): void;
}

/** One strip of every picture at the same height, in order, on PMG's dark. */
function collage(pictures: Picture[], h = 288, gap = 16): { tex: CanvasTexture; aspect: number } {
  const widths = pictures.map((p) => Math.round(h * (p.width / p.height)));
  const W = Math.min(
    8192,
    widths.reduce((a, b) => a + b + gap, 0),
  );
  const c = document.createElement('canvas');
  c.width = W;
  c.height = h;
  const ctx = c.getContext('2d') as CanvasRenderingContext2D;
  ctx.fillStyle = '#050807';
  ctx.fillRect(0, 0, W, h);
  let x = gap / 2;
  pictures.forEach((p, i) => {
    ctx.drawImage(p, x, 0, widths[i], h);
    x += widths[i] + gap;
  });
  const tex = new CanvasTexture(c);
  tex.colorSpace = SRGBColorSpace;
  tex.wrapS = RepeatWrapping;
  tex.wrapT = ClampToEdgeWrapping;
  tex.minFilter = LinearMipmapLinearFilter;
  tex.anisotropy = 8;
  return { tex, aspect: W / h };
}

function band(text: string, accent: string): CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 2048;
  c.height = 64;
  const ctx = c.getContext('2d') as CanvasRenderingContext2D;
  ctx.fillStyle = '#050807';
  ctx.fillRect(0, 0, 2048, 64);
  ctx.fillStyle = accent;
  ctx.font = '900 44px "PMG Shoulders", "Big Shoulders Display", sans-serif';
  const s = `${text.toUpperCase()}  ·  `;
  let x = 0;
  while (x < 2048) {
    ctx.fillText(s, x, 48);
    x += ctx.measureText(s).width;
  }
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.wrapS = RepeatWrapping;
  t.anisotropy = 8;
  return t;
}

/** Backs of the cylinders (seen through the open ends) go dark, so the front reads first. */
function darkBacks(mat: MeshBasicMaterial, keep: number) {
  mat.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <color_fragment>',
      `#include <color_fragment>\n  if (!gl_FrontFacing) diffuseColor.rgb *= ${keep.toFixed(2)};`,
    );
  };
}

export function createKinetic(
  pictures: Picture[],
  opts: { top: number; bottom: number; radius: number; accent: string; gaps?: [number, number][] },
): Kinetic {
  const group = new Group();
  const { tex, aspect } = collage(pictures);
  const H = 0.46;
  const B = 0.05;
  const step = H + B + 0.06;
  const r = opts.radius;
  const around = (2 * Math.PI * r) / H;
  const bandTex = band(
    'PMG Exclusive · 100% independent · Brooklyn, NY · Content · Distribution · Culture',
    opts.accent,
  );
  const geo = new CylinderGeometry(r, r, H, 96, 1, true);
  const bandGeo = new CylinderGeometry(r * 1.01, r * 1.01, B, 96, 1, true);
  const imgs: { tex: Texture; base: number; dir: number }[] = [];
  const mats: MeshBasicMaterial[] = [];
  const bands: { tex: Texture; dir: number }[] = [];
  let i = 0;
  for (let y = opts.top - H / 2; y > opts.bottom + H / 2; y -= step) {
    // Leave room where something else stands at the heart of the tower (the crate).
    if (opts.gaps?.some(([lo, hi]) => y > lo && y < hi)) continue;
    const t = tex.clone();
    t.repeat.set(around / aspect, 1);
    const base = (i * 0.37) % 1;
    t.offset.x = base;
    const mat = new MeshBasicMaterial({ map: t, side: DoubleSide, color: 0xc8c8c8 });
    mats.push(mat);
    darkBacks(mat, 0.28);
    const m = new Mesh(geo, mat);
    m.position.y = y;
    m.rotation.y = i * Math.PI * 0.5;
    group.add(m);
    imgs.push({ tex: t, base, dir: i % 2 ? -1 : 1 });
    const bt = bandTex.clone();
    bt.repeat.set((2 * Math.PI * r * 1.01) / (B * 32), 1);
    const bmat = new MeshBasicMaterial({ map: bt, side: DoubleSide });
    darkBacks(bmat, 0.35);
    const bm = new Mesh(bandGeo, bmat);
    bm.position.y = y - H / 2 - (step - H) / 2;
    bm.rotation.z = (i % 2 ? -1 : 1) * 0.035;
    group.add(bm);
    bands.push({ tex: bt, dir: i % 2 ? 1 : -1 });
    i += 1;
  }
  return {
    group,
    textures: [tex, bandTex],
    setLevel(level: number) {
      for (const m of mats) m.color.setScalar(0.78 * level);
    },
    update(scroll: number, time: number) {
      for (const k of imgs) k.tex.offset.x = k.base + k.dir * (scroll * 0.045 + time * 0.012);
      for (const b of bands) b.tex.offset.x = b.dir * (scroll * 0.09 + time * 0.03);
    },
  };
}
