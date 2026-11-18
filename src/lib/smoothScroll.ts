// The site's smooth scroll (Lenis): one instance for the whole app, run by <SmoothScroll>.
import Lenis from "lenis";

let lenis: Lenis | null = null;
let running = false;
let holds = 0;

const create = () =>
  new Lenis({
    duration: 1.2,
    easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    touchMultiplier: 2,
  });

export function startSmoothScroll() {
  running = true;
  if (holds === 0 && !lenis) lenis = create();
}

export function stopSmoothScroll() {
  running = false;
  lenis?.destroy();
  lenis = null;
}

/** Call once a frame. */
export function tickSmoothScroll(time: number) {
  lenis?.raf(time);
}

/**
 * The hub on the home page drives the scroll itself. It holds the site's smooth scroll off
 * while it is on screen and hands it back when the visitor leaves; every other page is as before.
 */
export function holdSmoothScroll(): () => void {
  holds += 1;
  lenis?.destroy();
  lenis = null;
  let released = false;
  return () => {
    if (released) return;
    released = true;
    holds -= 1;
    if (holds === 0 && running && !lenis) lenis = create();
  };
}
