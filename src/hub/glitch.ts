// Glitch Slice on the hub's big titles: each title is drawn as N copies, each clipped to one
// horizontal band, which together compose the word. Every few seconds a short burst picks new
// cut lines and shifts some bands sideways with a red/cyan channel split, then the title snaps
// back clean. Hovering or tapping a title makes it tear harder and more often.
//
// Ported from Asad's Strata library ("Glitch Slice", Whisper preset, the export he pasted on
// 2026-11-17): the slicer, the cut lines, the burst timing and the shadows are his code; here it
// is typed, runs only on the title in view, and leaves the plate image out. Strata credits the
// technique to three Codrops articles: CSS Glitch Effect (2017), 3D Perspective Glitch Hover
// Effect (2022), On-Scroll Sliced Text Animation (2023).

/** Whisper: rare, short, small tears. */
export const WHISPER = { intensity: 0.25, gap: 6, split: 3, bands: 9 };

type Params = typeof WHISPER;

/** A seeded stream of numbers in (0, 1), as in the original (Park–Miller). */
export function seeded(seed = 11): () => number {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
}

/** Random sorted cut lines from 0 to 1 for `n` bands. */
export function cuts(n: number, rnd: () => number): number[] {
  const c = [0];
  for (let i = 1; i < n; i += 1) c.push(rnd());
  c.push(1);
  return c.sort((a, b) => a - b);
}

/** How far the outer bands reach past the title's box, in percent of its height: glyph ink can
 *  stand outside the line boxes (parentheses, commas, accents at line-height 0.82). */
export const EDGE_SLACK = 30;

/** The clip for band i of n between cuts t and e (0..1): outer edges get slack, inner ones none. */
export function bandClip(i: number, n: number, t: number, e: number): string {
  const top = i === 0 ? -EDGE_SLACK : t * 100;
  const bottom = i === n - 1 ? 100 + EDGE_SLACK : e * 100;
  return `polygon(-20% ${top}%, 120% ${top}%, 120% ${bottom}%, -20% ${bottom}%)`;
}

const shadow = (s: number, a1: number, a2: number) =>
  `${(-s).toFixed(1)}px 0 rgba(255,43,74,${a1}), ${s.toFixed(1)}px 0 rgba(32,227,255,${a2})`;

class Slicer {
  bands: HTMLElement[] = [];
  constructor(
    readonly host: HTMLElement,
    private p: Params,
    private rnd: () => number,
  ) {}
  /** Rebuilds the title as a hidden sizer (keeps the layout) plus `n` clipped copies. */
  build(text: string) {
    this.host.setAttribute('aria-label', text);
    this.host.dataset.text = text;
    this.host.classList.add('glitch');
    this.host.replaceChildren();
    const sizer = document.createElement('span');
    sizer.className = 'sizer';
    sizer.setAttribute('aria-hidden', 'true');
    sizer.textContent = text;
    this.host.append(sizer);
    this.bands = Array.from({ length: this.p.bands }, () => {
      const b = document.createElement('span');
      b.className = 'band';
      b.setAttribute('aria-hidden', 'true');
      b.textContent = text;
      this.host.append(b);
      return b;
    });
    this.rest();
  }
  rest() {
    const n = this.bands.length;
    const fringe = this.p.split * 0.16;
    this.bands.forEach((b, i) => {
      b.style.clipPath = bandClip(i, n, i / n, (i + 1) / n);
      b.style.transform = 'none';
      b.style.textShadow = fringe ? shadow(fringe, 0.75, 0.7) : 'none';
    });
  }
  tear(amount: number, em: number) {
    const n = this.bands.length;
    const c = cuts(n, this.rnd);
    this.bands.forEach((b, i) => {
      b.style.clipPath = bandClip(i, n, c[i], c[i + 1] + 0.002);
      const hit = this.rnd() < 0.38;
      const dx = hit ? (this.rnd() - 0.5) * 2 * (0.02 + this.rnd() * 0.1) * amount * em : 0;
      b.style.transform = dx ? `translate3d(${dx.toFixed(1)}px,0,0)` : 'none';
      const s = (hit ? 1 : 0.25) * this.p.split * (0.4 + amount);
      b.style.textShadow = shadow(s, 0.85, 0.8);
    });
  }
}

export interface Glitch {
  /** Turns every element matching `selector` under `root` into a sliced title. Pointer events
   *  are delegated once per root, so rebuilding the titles leaves nothing behind. */
  attach(root: HTMLElement, selector: string): void;
  /** Changes one title's words (for example a live roster title) and rebuilds its bands. */
  setText(el: HTMLElement, text: string): void;
  /** The title in view; only it bursts. Null pauses every title clean. */
  focus(el: HTMLElement | null): void;
  /** Hands the clock to the caller (a film stepping frame by frame): the loop stops, the state
   *  and the random stream reset, and `step(dt)` advances the bursts by exactly dt seconds, so
   *  every film tears on the same frames. */
  manual(): void;
  step(dt: number): void;
  /** Stops the loop and the listeners. */
  stop(): void;
}

/** Runs its own animation loop, paused while the tab is hidden; nothing moves with reduced motion. */
export function createGlitch(p: Params = WHISPER, reduced = false): Glitch {
  let rnd = seeded(11);
  const draw = () => rnd();
  const slicers = new Map<HTMLElement, Slicer>();
  const roots = new Set<HTMLElement>();
  const off: (() => void)[] = [];
  let active: Slicer | null = null;
  let clock = 0;
  let next = 1.4;
  let burstEnd = -1;
  let step = 0;
  let hover = 0;
  let hoverT = 0;
  let speed = 0;
  const ptr = { x: 0, y: 0 };
  let raf = 0;
  let last = performance.now();

  const hostOf = (e: Event) =>
    e.target instanceof Element ? e.target.closest<HTMLElement>('.glitch') : null;
  const delegate = (root: HTMLElement) => {
    if (roots.has(root)) return;
    roots.add(root);
    const on = (type: string, fn: (e: PointerEvent) => void) => {
      const h = fn as EventListener;
      root.addEventListener(type, h);
      off.push(() => root.removeEventListener(type, h));
    };
    on('pointerover', (e) => {
      const el = hostOf(e);
      if (!el || el.contains(e.relatedTarget as Node | null)) return;
      if (slicers.get(el) !== active) return;
      hoverT = 1;
      next = Math.min(next, clock + 0.05);
    });
    on('pointerout', (e) => {
      const el = hostOf(e);
      if (!el || el.contains(e.relatedTarget as Node | null)) return;
      hoverT = 0;
    });
    on('pointermove', (e) => {
      if (!hostOf(e)) return;
      const d = Math.hypot(e.clientX - ptr.x, e.clientY - ptr.y);
      ptr.x = e.clientX;
      ptr.y = e.clientY;
      speed = Math.min(1, speed + d / 220);
    });
    on('pointerdown', (e) => {
      const el = hostOf(e);
      if (!el || slicers.get(el) !== active) return;
      next = clock;
      speed = 1;
    });
  };

  const advance = (dt: number) => {
    clock += dt;
    hover += (hoverT - hover) * (1 - Math.exp(-6 * dt));
    speed *= Math.exp(-2.5 * dt);
    if (!active) return;
    if (clock >= next && clock > burstEnd) {
      burstEnd = clock + 0.12 + draw() * 0.26 + hover * 0.25;
      step = 0;
      next = clock + (hover > 0.5 ? 0.25 + draw() * 0.65 : p.gap * (0.7 + draw() * 0.9));
    }
    if (clock < burstEnd) {
      step -= dt;
      if (step <= 0) {
        step = 0.045;
        const em = Number.parseFloat(getComputedStyle(active.host).fontSize);
        active.tear(p.intensity * (0.6 + hover * 0.9 + speed * 0.8), em);
      }
    } else if (burstEnd > 0) {
      active.rest();
      burstEnd = -1;
    }
  };
  const frame = (now: number) => {
    raf = requestAnimationFrame(frame);
    if (document.hidden) {
      last = now;
      return;
    }
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    advance(dt);
  };
  if (!reduced) raf = requestAnimationFrame(frame);

  return {
    attach(root, selector) {
      delegate(root);
      // The hub rebuilds its words on resize: forget titles that left the page.
      for (const el of [...slicers.keys()]) if (!el.isConnected) slicers.delete(el);
      if (active && !active.host.isConnected) active = null;
      for (const el of root.querySelectorAll<HTMLElement>(selector)) {
        if (slicers.has(el)) continue;
        const s = new Slicer(el, p, draw);
        s.build(el.dataset.text ?? el.textContent?.trim() ?? '');
        slicers.set(el, s);
      }
    },
    setText(el, text) {
      const s = slicers.get(el);
      if (s) s.build(text);
      else el.textContent = text;
    },
    focus(el) {
      const s = el ? (slicers.get(el) ?? null) : null;
      if (s === active) return;
      active?.rest();
      active = s;
      burstEnd = -1;
      hoverT = 0;
      // A new title in view tears soon after it settles, then keeps the calm gap.
      next = clock + 0.6 + draw() * 0.8;
    },
    manual() {
      cancelAnimationFrame(raf);
      rnd = seeded(11);
      clock = 0;
      next = 1.4;
      burstEnd = -1;
      step = 0;
      hover = 0;
      hoverT = 0;
      speed = 0;
      active?.rest();
    },
    step(dt) {
      if (!reduced) advance(dt);
    },
    stop() {
      cancelAnimationFrame(raf);
      for (const f of off) f();
      off.length = 0;
      roots.clear();
      for (const s of slicers.values()) s.rest();
    },
  };
}
