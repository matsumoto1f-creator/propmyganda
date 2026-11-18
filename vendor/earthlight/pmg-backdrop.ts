/*! @license Earthlight (https://github.com/maxvyshniakov/earthlight), adapted for the PMG hub.
 * MIT License
 *
 * Copyright (c) 2026 Max Vyshniakov
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 * Scene data keeps its own terms: see licenses/earthlight/NOTICE.md next to this site.
 */
// Earthlight as a fixed backdrop for the PMG hub: one camera parked over the New York area at
// night, no controls, drawn when the host asks for a frame.
//
// Adapted from Earthlight's src/scripts/background.ts (MIT, Copyright (c) 2026 Max Vyshniakov,
// see ./LICENSE). The scene data it streams keeps its own terms (./NOTICE.md): night lights NASA
// Earth Observatory Black Marble; surface and clouds NASA Blue Marble; Milky Way NASA/GSFC SVS,
// Ernie Wright, Deep Star Maps 2020, with Gaia DR2 ESA/Gaia/DPAC; stars HYG v4.1 by David Nash,
// CC BY-SA 4.0.
//
// Changes from the original: the camera is parked (Asad's corner framing, aimed so New York
// lands at a chosen screen point) instead of riding the ISS orbit, and turns slowly with the Sun
// so the Earth spins under it and stays night; the host drives every frame (so a film can step
// time); it streams the regional night-light tiles that the stock background leaves off;
// terrain, daylight detail and galaxy detail are off to keep the download small; and the Moon
// can be drawn larger than life (moonScale, a two-line change in scripts/scene-renderer.ts and
// scripts/asset-location.ts).
import { createSceneRenderer } from './scripts/scene-renderer';
import { sceneLook } from './scripts/scene-defaults';
import { equatorialFrame } from './scripts/celestial-sky';
import { SceneFocus } from './scripts/scene-assets';
import { sceneBufferSize, focusRenderScale, focusGrainScale, bufferDensity } from './scripts/scene-viewport';
import { sceneContext } from './scripts/webgl-context';
import { softwareRenderer } from './scripts/software-renderer';
import { PROJECTION } from './scripts/flight-navigation';
import { EARTH_RADIUS_KM as R, add, cross, dot, normalize, scale, type Vec3 } from './scripts/iss-orbit';

export interface BackdropView {
  /** The point under the camera, degrees. */
  lat: number;
  lon: number;
  altitudeKm: number;
  /** Compass bearing the camera faces, degrees. */
  heading: number;
  /** Degrees the camera looks below the local horizontal. */
  tilt: number;
  /** Degrees the camera is rolled about its line of sight. */
  roll: number;
  /** Earthlight's lens: 1 is its standard view, 0.5 twice as wide. */
  lens: number;
  /** UTC instant at scene time zero; it sets the Sun, the Moon and the stars. */
  epoch: string;
}

/** Asad's framing (his Earthlight screenshot, 2026-11-17): 1,702 km up, lens 0.5, the planet in
 *  the lower-left corner with its edge sweeping from the upper left down to the bottom. Tilt and
 *  roll were fitted to the edge in that screenshot. */
export const CORNER_NIGHT = {
  altitudeKm: 1702,
  tilt: 25,
  roll: 43,
  lens: 0.5,
  // 9 pm in New York on 26 November 2026: night under the camera, and a 91%-lit Moon that
  // drifts across the open sky above the planet and sets behind its edge as the Earth turns.
  epoch: '2026-11-27T02:00:00Z',
};
export const NYC = { lat: 40.71, lon: -74.0 };

export type BackdropStatus = 'probing' | 'loading' | 'live' | 'unavailable';

export interface EarthBackdrop {
  status(): BackdropStatus;
  /** Draws one frame for scene time `seconds`, turned by `yaw` and `pitch` (radians) from the
   *  parked pose. Returns true when the canvas holds a new frame to copy. */
  paint(seconds: number, yaw: number, pitch: number, now?: number): boolean;
  /** Blur radius of the opening focus pull; 0 once the detail has arrived. */
  focus(): number;
  /** Moves the parked camera (for example when the screen changes shape). */
  setView(view: BackdropView): void;
  resize(): void;
  dispose(): void;
}

const rad = Math.PI / 180;
const unit = (lat: number, lon: number): Vec3 => [
  Math.cos(lat * rad) * Math.cos(lon * rad),
  Math.cos(lat * rad) * Math.sin(lon * rad),
  Math.sin(lat * rad),
];

/** Camera [right, up, forward] in a frame whose vertical is `up`, facing `along` on the ground. */
function attitude(up: Vec3, along: Vec3, tilt: number, roll: number) {
  const side = normalize(cross(along, up));
  const forward = add(scale(along, Math.cos(-tilt)), scale(up, Math.sin(-tilt)));
  const cameraUp = normalize(cross(side, forward));
  const right = add(scale(side, Math.cos(roll)), scale(cameraUp, Math.sin(roll)));
  const up2 = add(scale(cameraUp, Math.cos(roll)), scale(side, -Math.sin(roll)));
  return { right, up: up2, forward };
}

/** Earth-fixed camera position and basis [right, up, forward], turned by yaw/pitch (radians). */
export function viewPose(view: BackdropView, yaw = 0, pitch = 0) {
  const up = unit(view.lat, view.lon);
  const east: Vec3 = [-Math.sin(view.lon * rad), Math.cos(view.lon * rad), 0];
  const north = normalize(cross(up, east));
  const h = view.heading * rad + yaw;
  const along = add(scale(north, Math.cos(h)), scale(east, Math.sin(h)));
  const b = attitude(up, along, view.tilt * rad - pitch, view.roll * rad);
  const camera = scale(up, 1 + view.altitudeKm / R);
  return { camera, basis: [...b.right, ...b.up, ...b.forward] };
}

/** Places the camera so that `target` shows at screen point `at` (0..1 from the top left) on a
 *  screen of `aspect`, keeping altitude, tilt and roll (so the planet's edge stays where it is),
 *  with the camera's ground point lying from the target along compass bearing `approach`. */
export function aimView(
  base: Omit<BackdropView, 'lat' | 'lon' | 'heading'>,
  target: { lat: number; lon: number },
  at: [number, number],
  aspect: number,
  approach: number,
): BackdropView {
  const r = 1 + base.altitudeKm / R;
  const focal = PROJECTION * base.lens;
  // Local frame at the ground point, facing north: east x, north y, up z.
  const b = attitude([0, 0, 1], [0, 1, 0], base.tilt * rad, base.roll * rad);
  const d = normalize(
    add(
      add(b.forward, scale(b.right, ((at[0] - 0.5) * aspect) / focal)),
      scale(b.up, (0.5 - at[1]) / focal),
    ),
  );
  const c: Vec3 = [0, 0, r];
  const cd = dot(c, d);
  const t = -cd - Math.sqrt(Math.max(0, cd * cd - (r * r - 1)));
  const hit = normalize(add(c, scale(d, t)));
  const gamma = Math.acos(Math.max(-1, Math.min(1, hit[2])));
  const beta = Math.atan2(hit[0], hit[1]);
  // The ground point: `gamma` radians from the target along `approach`.
  const p1 = target.lat * rad;
  const l1 = target.lon * rad;
  const a = approach * rad;
  const p2 = Math.asin(
    Math.sin(p1) * Math.cos(gamma) + Math.cos(p1) * Math.sin(gamma) * Math.cos(a),
  );
  const l2 =
    l1 +
    Math.atan2(
      Math.sin(a) * Math.sin(gamma) * Math.cos(p1),
      Math.cos(gamma) - Math.sin(p1) * Math.sin(p2),
    );
  // Bearing from the ground point back to the target; the camera faces that minus `beta`.
  const toward = Math.atan2(
    Math.sin(l1 - l2) * Math.cos(p1),
    Math.cos(p2) * Math.sin(p1) - Math.sin(p2) * Math.cos(p1) * Math.cos(l1 - l2),
  );
  return { ...base, lat: p2 / rad, lon: l2 / rad, heading: (toward - beta) / rad };
}

/** Turns a vector about the Earth's axis (z) by `a` radians. */
const turn = (v: Vec3, a: number): Vec3 => [
  Math.cos(a) * v[0] - Math.sin(a) * v[1],
  Math.sin(a) * v[0] + Math.cos(a) * v[1],
  v[2],
];

/** The observer for the parked view, turned `spin` radians about the Earth's axis. The date
 *  stays at the epoch, so the Moon and stars hold their places in the sky; the camera and the
 *  Sun turn together, so the land rolls by underneath and the side we see stays night. */
function observerAt(view: BackdropView, date: Date, yaw: number, pitch: number, spin = 0) {
  const pose = viewPose(view, yaw, pitch);
  const camera = turn(pose.camera, spin);
  const basis = [0, 3, 6].flatMap((i) => turn(pose.basis.slice(i, i + 3) as Vec3, spin));
  const n = normalize(camera);
  const sun = turn(equatorialFrame(date).sun, spin);
  const solar = dot(n, sun);
  const distance = Math.hypot(...camera);
  return {
    date,
    camera,
    cameraBasis: basis,
    right: basis.slice(0, 3) as Vec3,
    up: basis.slice(3, 6) as Vec3,
    forward: basis.slice(6, 9) as Vec3,
    sun,
    solar,
    latitude: Math.asin(Math.max(-1, Math.min(1, n[2]))) / rad,
    longitude: Math.atan2(n[1], n[0]) / rad,
    altitude: (distance - 1) * R,
    shadow: solar < -Math.sqrt(1 - 1 / (distance * distance)) ? 1 : 0,
    phase: solar > 0.08 ? 'Day' : solar < -0.12 ? 'Night' : 'Dusk',
    focal: PROJECTION * view.lens,
  };
}

export function createEarthBackdrop(
  canvas: HTMLCanvasElement,
  opts: {
    assetBase: string;
    view: BackdropView;
    allowSoftware?: boolean;
    timeScale?: number;
    /** Largest share of the screen's pixels Earthlight draws (its own cap is 0.75). */
    maxScale?: number;
    /** Degrees a second the Earth turns under the camera (0 parks it). */
    spin?: number;
    /** How much larger than life the Moon is drawn (at this wide lens the real one is a dot). */
    moonScale?: number;
    /** A fixed exposure (EV) instead of Earthlight's meter, which a bright Moon pulls down. */
    exposureEV?: number | null;
    /** The aurora volume (on, as in Asad's screenshot). */
    aurora?: boolean;
  },
): EarthBackdrop {
  const maxScale = opts.maxScale ?? 0.75;
  let view = opts.view;
  const epoch = Date.parse(view.epoch);
  const timeScale = opts.timeScale ?? 10;
  const spin = opts.spin ?? 0;
  const params = new URLSearchParams({
    texture: 'compact',
    terrain: '0',
    dayDetail: '0',
    cloudDetail: '0',
    galaxyDetail: '0',
    motionBlur: '0',
    // The enlarged Moon would cross Earthlight's resolved-surface threshold and fetch NASA's CGI
    // Moon Kit map; at the hub's exposure it is a white disc anyway, so keep the sampled disc.
    moonSurface: 'off',
  });
  if (opts.aurora === false) params.set('aurora', '0');
  const attributes: WebGLContextAttributes = {
    alpha: false,
    antialias: false,
    depth: false,
    powerPreference: 'high-performance',
    failIfMajorPerformanceCaveat: !opts.allowSoftware,
  };
  let state: BackdropStatus = 'probing';
  let renderer: ReturnType<typeof createSceneRenderer> | undefined;
  let gl: WebGLRenderingContext | null = null;
  let disposed = false;
  let scale_ = 0.75;
  let focusRadius = 6;
  let cssHeight = 1;
  let density = 1.5;
  let grain = 0;
  let lastDraw = 0;
  const focus = new SceneFocus();

  const resize = () => {
    const bounds = canvas.getBoundingClientRect();
    cssHeight = Math.max(1, bounds.height);
    density = bufferDensity(bounds.width, bounds.height, devicePixelRatio, Math.min(maxScale, scale_));
    const size = sceneBufferSize(
      bounds.width,
      bounds.height,
      devicePixelRatio,
      Math.min(maxScale, scale_) * focusRenderScale(focusRadius, density),
    );
    const changed = canvas.width !== size.width || canvas.height !== size.height;
    if (canvas.width !== size.width) canvas.width = size.width;
    if (canvas.height !== size.height) canvas.height = size.height;
    gl?.viewport(0, 0, canvas.width, canvas.height);
    return changed;
  };

  const start = () => {
    if (disposed) return;
    gl = sceneContext(canvas, params, attributes);
    if (!gl) {
      state = 'unavailable';
      return;
    }
    renderer = createSceneRenderer(gl, canvas, params, () => {}, {
      background: false,
      moonScale: opts.moonScale,
      assetBaseURL: opts.assetBase,
    });
    resize();
    renderer.load();
    state = 'loading';
  };

  const onLost = (e: Event) => {
    e.preventDefault();
    renderer?.contextLost();
    state = 'unavailable';
  };
  canvas.addEventListener('webglcontextlost', onLost);

  if (opts.allowSoftware) start();
  else
    softwareRenderer(attributes).then((software) => {
      if (disposed) return;
      if (software) state = 'unavailable';
      else start();
    });

  const draw = (seconds: number, yaw: number, pitch: number, now: number, again: boolean): boolean => {
      if (!renderer || state === 'unavailable' || disposed) return false;
      const rs = renderer.state as Record<string, unknown>;
      if (!('surfaceReady' in rs) && !('galaxyReady' in rs)) return false;
      const ready = (renderer as { frameAvailable?: () => boolean }).frameAvailable?.() ?? true;
      if (!ready) return false;
      renderer.observeAnimationFrame(now);
      // Only real frame gaps steer the adaptive resolution; a host stepping a film frame by
      // frame (or a hidden tab) would read as a slow GPU and blur the picture.
      if (lastDraw && focusRadius === 0 && !again && now - lastDraw < 100)
        renderer.observeCadence(now - lastDraw, now);
      lastDraw = focusRadius === 0 ? now : 0;
      const sceneTime = seconds * timeScale;
      // The date holds at the epoch (Moon and stars stay put); the Earth turns eastward under a
      // camera that turns west with the Sun, so the night never ends (a running clock turned
      // the view to daylight after about 45 minutes open). Scene time moves clouds and lights.
      const observer = observerAt(view, new Date(epoch), yaw, pitch, -spin * seconds * rad);
      const base = { ...sceneLook, manualExposure: opts.exposureEV ?? null };
      const look =
        focusRadius > 0
          ? { ...base, grain: base.grain * focusGrainScale(focusRadius, density) }
          : base;
      const result = renderer.render(
        observer,
        canvas.width,
        canvas.height,
        cssHeight,
        sceneTime,
        grain++,
        look,
        focusRadius,
        timeScale,
      );
      if (!result) return false;
      state = 'live';
      const nextFocus = focus.value(now, true, renderer.assets.detailProgress);
      const nextScale = Math.min(maxScale, result.scale);
      const refit =
        nextScale !== scale_ ||
        focusRenderScale(nextFocus, density) !== focusRenderScale(focusRadius, density);
      scale_ = nextScale;
      focusRadius = nextFocus;
      // A new buffer size clears the drawing buffer: draw again so the host copies a full frame.
      if (refit && resize() && !again) return draw(seconds, yaw, pitch, now, true);
      return true;
  };

  return {
    status: () => state,
    focus: () => focusRadius,
    setView: (next) => {
      view = next;
    },
    resize: () => {
      resize();
    },
    paint: (seconds, yaw, pitch, now = performance.now()) => draw(seconds, yaw, pitch, now, false),
    dispose() {
      disposed = true;
      canvas.removeEventListener('webglcontextlost', onLost);
      renderer?.dispose();
      renderer = undefined;
    },
  };
}
