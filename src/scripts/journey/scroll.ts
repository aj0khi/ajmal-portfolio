// Scroll is the throttle. The page scrolls natively; Lenis smooths the wheel; one GSAP
// timeline, scrubbed by ScrollTrigger, turns scroll into the journey position `p`. Each stop
// is a drive (the rover moves) followed by a dwell (parked, the stop is live).
//
// Snapping: one deliberate gesture (a wheel tick, a swipe) takes you to the next stop in that
// direction, whether you started parked at a stop or mid-drive; a tiny nudge while parked
// stays put. It reacts to the end of your gesture, not to the end of Lenis's smoothing, so
// the glide starts while the page is still moving.
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { FLIGHT, stops } from '../../data/journey';
import { clamp } from './util';

gsap.registerPlugin(ScrollTrigger);

const IDLE_MS = 120;
const DELIBERATE_PX = 40; // a gesture shorter than this, while parked, is treated as a nudge
const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;
const easeInOutSine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;

export function createScroll(track: HTMLElement, reduced: boolean) {
  const state = { p: 0 };

  const timeline = gsap.timeline({ paused: true });
  stops.forEach((stop, i) => {
    // Ground drives ease in and out (the rover pulls away and parks); the flight keeps a
    // linear clock because its storyboard paces itself.
    if (i > 0) timeline.to(state, { p: i, duration: stop.drive, ease: i === FLIGHT ? 'none' : 'sine.inOut' });
    timeline.addLabel(stop.id);
    timeline.to({}, { duration: stop.dwell });
    timeline.addLabel(`${stop.id}:end`);
  });
  const total = timeline.duration();
  // One screen of scroll per unit of timeline; the extra screen is the last viewport itself.
  track.style.height = `calc(${total + 1} * 100svh)`;

  ScrollTrigger.config({ ignoreMobileResize: true });
  const trigger = ScrollTrigger.create({ trigger: track, start: 'top top', end: 'bottom bottom', scrub: true, animation: timeline });

  let lenis: Lenis | undefined;
  if (!reduced) {
    lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 0.9 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis?.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  // Each stop's dwell, in page pixels: arrive (rover parks) to leave (rover pulls away).
  let marks: { arrive: number; leave: number }[] = [];
  const measure = () => {
    const toPx = (time: number) => trigger.start + (time / total) * (trigger.end - trigger.start);
    marks = stops.map((stop) => ({ arrive: toPx(timeline.labels[stop.id]), leave: toPx(timeline.labels[`${stop.id}:end`]) }));
  };
  ScrollTrigger.addEventListener('refresh', measure);
  // The world loads after the page has, so ScrollTrigger's own refresh on `load` has already
  // passed: refresh now, or the trigger's start and end (and every stop mark) read as zero.
  ScrollTrigger.refresh();
  measure();

  const position = () => lenis?.targetScroll ?? scrollY;
  let direction = 1;
  let snapping = false;

  // A glide's duration comes from the drives it covers: each stop sets how long its own drive
  // takes (the flight is slow on purpose), scaled by how much of that drive is still ahead.
  // Jumps across several stops from the trip meter are capped so they never drag.
  const go = (target: number) => {
    // Whatever started this glide (a tap, a key, a settled gesture) closes the gesture, so a
    // pending settle can't fire afterwards and send the rover one stop further.
    clearTimeout(timer);
    timer = 0;
    gestureOpen = false;
    if (!lenis) { scrollTo({ top: target, behavior: 'instant' }); return; }
    const from = lenis.animatedScroll;
    const low = Math.min(from, target); const high = Math.max(from, target);
    let seconds = 0; let drives = 0;
    for (let i = 1; i < marks.length; i += 1) {
      const start = marks[i - 1].leave; const end = marks[i].arrive;
      const covered = Math.max(0, Math.min(high, end) - Math.max(low, start)) / Math.max(1, end - start);
      if (covered > 0) { seconds += covered * stops[i].glide; drives += 1; }
    }
    const duration = drives > 1 ? Math.min(seconds, 2.4 + drives * 0.15) : Math.max(0.5, seconds);
    snapping = true;
    lenis.scrollTo(target, {
      duration,
      easing: duration > 4 || drives > 1 ? easeInOutSine : easeOutCubic,
      onComplete: () => { snapping = false; }
    });
  };

  // A gesture opens on its first wheel tick or touch, and closes when it settles; its start is
  // recorded once, before the page moves.
  let gestureStart = 0;
  let gestureOpen = false;
  const begin = (from = position()) => { if (!gestureOpen) { gestureOpen = true; gestureStart = from; } };
  const settle = () => {
    timer = 0;
    gestureOpen = false;
    const y = position();
    const last = marks[marks.length - 1];
    if (y > last.leave + 4) return; // past the journey: an ordinary page
    const parked = marks.some((mark) => y >= mark.arrive - 4 && y <= mark.leave + 4);
    if (parked && Math.abs(y - gestureStart) < DELIBERATE_PX) return;
    const next = direction > 0 ? marks.find((mark) => mark.arrive > y + 4) : [...marks].reverse().find((mark) => mark.arrive < y - 4);
    if (next) go(next.arrive);
  };
  let timer = 0;
  const arm = () => {
    clearTimeout(timer);
    timer = window.setTimeout(settle, IDLE_MS);
  };

  addEventListener('wheel', (event) => {
    if (!event.deltaY || event.ctrlKey || document.querySelector('dialog[open]')) return;
    direction = Math.sign(event.deltaY);
    snapping = false;
    begin();
    arm();
    // Capture phase: this must run before Lenis applies the delta, so the gesture's start
    // position is where the page was, not where this tick is taking it.
  }, { passive: true, capture: true });
  let touchY = 0;
  let touching = false;
  addEventListener('touchstart', (event) => {
    touching = true;
    snapping = false;
    touchY = event.touches[0].clientY;
    clearTimeout(timer);
    timer = 0;
    gestureOpen = false;
    begin();
  }, { passive: true });
  addEventListener('touchmove', (event) => {
    const y = event.touches[0].clientY;
    if (Math.abs(y - touchY) > 2) direction = y < touchY ? 1 : -1;
    touchY = y;
  }, { passive: true });
  let touchedAt = -Infinity;
  addEventListener('touchend', () => { touching = false; touchedAt = performance.now(); arm(); }, { passive: true });
  // After a touch the page keeps coasting natively; wait for that to finish too. Other native
  // scrolls (dragging the scrollbar, find-in-page) are left alone, so a held scrollbar thumb
  // is never yanked away mid-drag.
  let lastY = scrollY;
  addEventListener('scroll', () => {
    const y = scrollY;
    const coasting = performance.now() - touchedAt < 1500;
    if (coasting && !touching && !snapping && lenis?.isScrolling === 'native' && y !== lastY) {
      direction = Math.sign(y - lastY);
      begin(lastY);
      arm();
    }
    lastY = y;
  }, { passive: true });

  const stopAt = () => {
    const y = position();
    let index = 0;
    marks.forEach((mark, i) => { if (y >= mark.arrive - innerHeight * 0.5) index = i; });
    return index;
  };
  const goToStop = (index: number) => { const mark = marks[clamp(index, 0, marks.length - 1)]; if (mark) go(mark.arrive); };

  addEventListener('keydown', (event) => {
    const step = ({ ArrowDown: 1, PageDown: 1, ' ': 1, ArrowUp: -1, PageUp: -1 } as Record<string, number>)[event.key];
    const target = event.target as HTMLElement;
    // Text fields and dialogs keep their keys; on a focused button or link only Space is left to
    // the browser (it presses the button), so arrows keep stepping after a click.
    if (!step || event.altKey || event.ctrlKey || event.metaKey || target.closest('input, textarea, select, [contenteditable], dialog')) return;
    if (event.key === ' ' && target.closest('button, a')) return;
    const y = position();
    if (y > marks[marks.length - 1].leave + 4) return; // past the journey: native keys
    const forward = step * (event.key === ' ' && event.shiftKey ? -1 : 1);
    const next = forward > 0 ? marks.find((mark) => mark.arrive > y + 4) : [...marks].reverse().find((mark) => mark.arrive < y - 4);
    if (!next) return;
    event.preventDefault();
    direction = forward;
    go(next.arrive);
  });

  const dwellTimes = stops.map((stop) => [timeline.labels[stop.id], timeline.labels[`${stop.id}:end`]] as const);
  // While a kiosk is open the journey holds still behind it.
  const pause = (on: boolean) => { if (on) lenis?.stop(); else lenis?.start(); };

  return { state, timeline, dwellTimes, goToStop, stopAt, pause };
}

export type JourneyScroll = ReturnType<typeof createScroll>;
