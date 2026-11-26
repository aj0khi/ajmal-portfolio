// One room per screen. Touch and scrollbars snap natively (CSS scroll-snap); a wheel tick,
// a trackpad nudge, or an arrow key steps exactly one room the moment its direction is
// clear. Either way this module names the new room at once, so the hall starts its sweep on
// the first frame instead of waiting for the page to finish scrolling.

export type RoomChange = (to: number, from: number) => void;
export type Tour = { rooms: HTMLElement[]; current: () => number; on: (listener: RoomChange) => void };

// Odd rooms sweep in from the right, even rooms from the left, so the walk alternates.
export const entersFrom = (index: number) => (index % 2 === 1 ? 1 : -1);

// +1: the new room slides in from the right edge. -1: from the left. 0: no sweep (first paint).
// Walking back plays the arrival in reverse, so the room leaves the way it came in.
export const sweepFor = (to: number, from: number) => {
  if (from < 0 || to === from) return 0;
  return to > from ? entersFrom(to) : -entersFrom(from);
};

export function startTour(root: HTMLElement): Tour {
  const rooms = [...root.querySelectorAll<HTMLElement>('[data-room]')];
  const floorLinks = [...document.querySelectorAll<HTMLElement>('[data-floor-link]')];
  const counter = document.querySelector<HTMLElement>('[data-floor-count]');
  const listeners: RoomChange[] = [];
  const archive = document.querySelector<HTMLElement>('.archive');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let index = -1;
  let tops: number[] = [];
  let archiveTop = Infinity;
  // While a stepped scroll is travelling, the destination is already known; the position
  // passing the halfway mark must not flip the room back.
  let steering = { to: -1, until: 0 };

  const measure = () => {
    tops = rooms.map((room) => room.getBoundingClientRect().top + scrollY);
    archiveTop = archive ? archive.getBoundingClientRect().top + scrollY : Infinity;
  };

  // The room holding the middle of the viewport. Rooms are one screen tall, so this flips
  // halfway through a snap; rooms with extra content still read correctly while scrolled inside.
  const pick = () => {
    if (performance.now() < steering.until) return steering.to;
    const probe = scrollY + innerHeight / 2;
    let found = 0;
    tops.forEach((top, i) => { if (probe >= top) found = i; });
    return found;
  };

  const set = (next: number) => {
    if (next === index || next < 0) return;
    const previous = index;
    index = next;
    rooms.forEach((room, i) => room.classList.toggle('is-active', i === next));
    floorLinks.forEach((link, i) => link.toggleAttribute('aria-current', i === next));
    root.style.setProperty('--tour-progress', String(next / (rooms.length - 1)));
    if (counter) counter.textContent = `${String(next).padStart(2, '0')} / ${String(rooms.length - 1).padStart(2, '0')}`;
    listeners.forEach((listener) => listener(next, previous));
  };

  // Chromium announces the snap target at the start of a wheel or key scroll, and as a drag
  // crosses halfway. Elsewhere the scroll position decides.
  const snapEvents = 'onscrollsnapchanging' in window;
  const onSnap = (event: Event) => {
    const target = (event as Event & { snapTargetBlock?: Element | null }).snapTargetBlock;
    const at = target ? rooms.indexOf(target as HTMLElement) : -1;
    if (at >= 0) set(at);
  };
  document.addEventListener('scrollsnapchanging', onSnap);

  let queued = false;
  let settle = 0;
  addEventListener('scroll', () => {
    clearTimeout(settle);
    settle = window.setTimeout(() => set(pick()), 140); // scrollend stand-in for Safari
    if (snapEvents || queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; set(pick()); });
  }, { passive: true });
  addEventListener('scrollend', () => { steering.until = 0; set(pick()); });

  // Step one room up or down, starting the sweep now and letting the page catch up.
  const step = (direction: number) => {
    const to = index + direction;
    if (to < 0) return;
    const top = to < rooms.length ? tops[to] : archiveTop;
    if (!Number.isFinite(top)) return;
    steering = { to: Math.min(to, rooms.length - 1), until: performance.now() + 1200 };
    scrollTo({ top, behavior: reduced.matches ? 'instant' : 'smooth' });
    set(steering.to);
  };

  // Where the wheel belongs to the hall: inside a room that fits on screen, at the edge of
  // a taller one, or at the very top of the archive heading back in. Everywhere else the
  // page scrolls natively.
  const owns = (direction: number) => {
    if (document.querySelector('dialog[open]')) return false;
    if (scrollY >= archiveTop - 2) return direction < 0 && scrollY <= archiveTop + 2;
    const room = rooms[index];
    if (!room) return false;
    const top = tops[index];
    const bottom = top + room.offsetHeight - innerHeight;
    return direction > 0 ? scrollY >= bottom - 2 : scrollY <= top + 2;
  };

  // Trackpads keep firing wheel events for a second after the swipe (inertia). After a
  // step, the tail is swallowed; a new step needs a pause or a fresh, harder push.
  let lockedUntil = 0;
  let lastWheel = 0;
  let lastSize = 0;
  let pushed = 0;
  addEventListener('wheel', (event) => {
    if (event.ctrlKey || !event.deltaY) return;
    const direction = Math.sign(event.deltaY);
    const fromArchive = scrollY >= archiveTop - 2;
    const now = performance.now();
    // Mid-step the page sits between two rooms, where the hall wouldn't normally own the
    // wheel; the inertia tail still has to be swallowed or it cancels the step's scroll.
    if (document.querySelector('dialog[open]') || (fromArchive && direction > 0) || (now >= lockedUntil && !owns(direction))) return;
    event.preventDefault();
    const size = Math.abs(event.deltaY);
    const freshGesture = now - lastWheel > 160 || (size > lastSize * 1.8 && size > 24);
    lastWheel = now;
    lastSize = size;
    if (now < lockedUntil && !freshGesture) { lockedUntil = Math.max(lockedUntil, now + 90); return; }
    if (now < lockedUntil - 600) return;
    pushed = freshGesture ? event.deltaY : pushed + event.deltaY;
    if (Math.abs(pushed) < 28) return;
    pushed = 0;
    lockedUntil = now + 800;
    if (fromArchive) { steering = { to: rooms.length - 1, until: now + 1200 }; scrollTo({ top: tops[rooms.length - 1], behavior: reduced.matches ? 'instant' : 'smooth' }); set(rooms.length - 1); }
    else step(direction);
  }, { passive: false });

  addEventListener('keydown', (event) => {
    const keys: Record<string, number> = { ArrowDown: 1, PageDown: 1, ' ': 1, ArrowUp: -1, PageUp: -1 };
    const direction = keys[event.key] * (event.key === ' ' && event.shiftKey ? -1 : 1);
    const target = event.target as HTMLElement;
    if (!direction || event.altKey || event.ctrlKey || event.metaKey || target.closest('input, textarea, select, button, [contenteditable], dialog, summary')) return;
    if (scrollY >= archiveTop - 2 || !owns(direction)) return;
    event.preventDefault();
    step(direction);
  });

  addEventListener('resize', measure);
  new ResizeObserver(measure).observe(root);

  // In-page links to a room jump straight there and let the hall sweep once, rather than
  // smooth-scrolling through every room in between.
  document.addEventListener('click', (event) => {
    const link = (event.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#"]');
    const room = link && rooms.find((item) => `#${item.id}` === link.getAttribute('href'));
    if (!room || event.defaultPrevented || event.metaKey || event.ctrlKey) return;
    event.preventDefault();
    measure();
    const at = rooms.indexOf(room);
    steering = { to: at, until: 0 };
    scrollTo({ top: tops[at], behavior: 'instant' });
    set(at);
    history.pushState(null, '', `#${room.id}`);
    room.querySelector<HTMLElement>('h1, h2')?.focus({ preventScroll: true });
  });

  measure();
  set(pick());
  return { rooms, current: () => index, on: (listener) => { listeners.push(listener); } };
}
