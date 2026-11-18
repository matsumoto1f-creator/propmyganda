// The hub's backdrop: Earthlight's night Earth with New York (vendor/earthlight, MIT, by Max
// Vyshniakov), drawn in its own hidden canvas and handed to the hub scene as a texture so the
// hub's glow and lens fall on it too. A still of the same view stands in until the live scene
// draws, and for good where it cannot (software drawing, a lost context).
//
// The Earth is always drawn at one of two fixed shapes, the shapes of its two stills: wide
// (16:10) on landscape screens, tall (9:16) on portrait ones. The hub cover-fits that picture to
// the screen exactly as it cover-fits the still, so the live Earth and its still line up at
// every screen size and the cross-fade between them never shifts a city.

/** Earthlight's pinned scene data (night lights, clouds, stars), as its README embeds it. */
export const EARTH_ASSETS = 'https://media.maxvyshniakov.com/earthlight/76add0714c798c49/';

export type EarthKind = 'wide' | 'tall';
/** Width / height of the Earth picture, live and still (the stills are 1920x1200 and 900x1600). */
export const EARTH_ASPECT: Record<EarthKind, number> = { wide: 1.6, tall: 0.5625 };
export const earthKind = (w: number, h: number): EarthKind => (w / h < 1 ? 'tall' : 'wide');
/** How fast the Earth turns under the camera, degrees a second (one turn in 24 minutes). */
export const SPIN_DEG_PER_S = 0.25;

export interface EarthLayer {
  canvas: HTMLCanvasElement;
  /** True once the live scene has drawn a frame. */
  live(): boolean;
  /** True when Earthlight gave up (software drawing, lost context): keep the still. */
  failed(): boolean;
  /** Blur radius of Earthlight's opening focus pull; 0 when sharp. */
  focus(): number;
  /** Draws one frame `t` seconds into the Earth's turn; true when the canvas holds a new frame.
   *  The hub starts the turn when the live Earth begins to fade in, so it starts on the still. */
  paint(t: number, yaw: number, pitch: number): boolean;
  /** Stops Earthlight, frees its GPU memory and removes its canvas. */
  dispose(): void;
}

/** Starts the live Earth behind the hub. The renderer's code loads only now, after the hub. */
export async function startEarth(
  host: HTMLElement,
  opts: {
    allowSoftware?: boolean;
    maxScale?: number;
    aurora?: boolean;
    /** EV; NaN (from ?earthEV=auto) runs Earthlight's own meter. */
    exposureEV?: number;
    spin?: number;
    moonScale?: number;
  } = {},
): Promise<EarthLayer> {
  const canvas = document.createElement('canvas');
  canvas.className = 'earth-source';
  canvas.setAttribute('aria-hidden', 'true');
  host.prepend(canvas);
  const { createEarthBackdrop, aimView, CORNER_NIGHT, NYC } = await import('earthlight-backdrop');
  // Asad's framing: the planet in the lower-left corner, seen from 1,702 km. New York sits in the
  // strip of lit land between the planet's edge and the words; the tall picture looks a little
  // further down so the planet rises above the words. (The hub draws the picture 8% oversized
  // and slides it with the scroll, which lowers it a little at the top of the page; the aim
  // allows for that.) The camera hangs over the Gulf coast, south-west of the city, looking
  // east-north-east across the lit South-east.
  const viewFor = (kind: EarthKind) =>
    kind === 'wide'
      ? aimView(CORNER_NIGHT, NYC, [0.25, 0.47], EARTH_ASPECT.wide, 235)
      : aimView(
          { ...CORNER_NIGHT, tilt: CORNER_NIGHT.tilt + 8 },
          NYC,
          [0.24, 0.52],
          EARTH_ASPECT.tall,
          235,
        );
  // The canvas takes the picture's fixed shape at the smallest size that covers the screen.
  let kind = earthKind(innerWidth, innerHeight);
  const size = () => {
    const w = innerWidth;
    const h = Math.max(1, innerHeight);
    const a = EARTH_ASPECT[earthKind(w, h)];
    const cw = w / h > a ? w : h * a;
    canvas.style.width = `${Math.round(cw)}px`;
    canvas.style.height = `${Math.round(cw / a)}px`;
  };
  size();
  const earth = createEarthBackdrop(canvas, {
    assetBase: EARTH_ASSETS,
    view: viewFor(kind),
    allowSoftware: opts.allowSoftware,
    timeScale: 10,
    maxScale: opts.maxScale,
    aurora: opts.aurora,
    // Asad, 2026-11-18: "keep it dark, slowly spinning with the moon showing sometimes".
    // One turn every 24 minutes. New York stays in view about 80 s after the fade-in. On a wide
    // screen the Moon starts above the logo and drifts left across the open sky, leaving the
    // left edge about 4 minutes in; on a tall one it enters about a minute in and crosses near
    // the logo. It comes round again each turn, drawn 5x its true size so it reads.
    spin: opts.spin ?? SPIN_DEG_PER_S,
    moonScale: opts.moonScale ?? 5,
    // A fixed exposure: the large, bright Moon pulled Earthlight's meter down until the city
    // lights vanished. EV 1 matches what the meter chose for this view without the Moon.
    exposureEV:
      opts.exposureEV === undefined ? 1 : Number.isFinite(opts.exposureEV) ? opts.exposureEV : null,
  });
  const onResize = () => {
    size();
    const next = earthKind(innerWidth, innerHeight);
    if (next !== kind) {
      kind = next;
      earth.setView(viewFor(kind));
    }
    earth.resize();
  };
  addEventListener('resize', onResize);
  return {
    canvas,
    live: () => earth.status() === 'live',
    failed: () => earth.status() === 'unavailable',
    focus: () => earth.focus(),
    paint: (t, yaw, pitch) => earth.paint(t, yaw, pitch),
    dispose: () => {
      removeEventListener('resize', onResize);
      earth.dispose();
      canvas.remove();
    },
  };
}
