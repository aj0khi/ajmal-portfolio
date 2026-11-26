// The pocket guide: phones, portrait tablets, and browsers without WebGL see each room as a
// catalogue photograph of the 3D hall, and the same alternating sweep plays in plain CSS
// transforms. No Three.js is downloaded on this path. On desktop the same photographs are the
// poster shown while the live hall loads; the returned function stops them once it takes over.
import { sweepFor, type Tour } from './tour';
import { SWEEP } from './sweep';

export function startPlates(root: HTMLElement, tour: Tour) {
  let enabled = true;
  const plates = [...root.querySelectorAll<HTMLElement>('[data-plate]')];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');

  // Only the current room and its neighbours are fetched, so a visitor who reads two rooms
  // downloads three images, not fifteen.
  const load = (index: number) => [index - 1, index, index + 1].forEach((at) => {
    const image = plates[at]?.querySelector<HTMLImageElement>('img[data-src]');
    if (!image) return;
    image.src = image.dataset.src ?? '';
    image.removeAttribute('data-src');
  });

  const show = (to: number, from: number) => {
    if (!enabled) return;
    load(to);
    plates.forEach((plate) => plate.getAnimations({ subtree: true }).forEach((animation) => animation.cancel()));
    plates.forEach((plate, at) => { plate.hidden = at !== to && at !== from; plate.classList.toggle('is-front', at === to); });
    const direction = sweepFor(to, from);
    if (!direction || reduced.matches) {
      if (plates[from] && from !== to) plates[from].hidden = true;
      return;
    }
    root.dataset.sweep = direction > 0 ? 'from-right' : 'from-left';
    const incoming = plates[to];
    const outgoing = plates[from];
    incoming.animate([{ transform: `translate3d(${direction * 100}%, 0, 0)` }, { transform: 'none' }], SWEEP.slide);
    incoming.querySelector('img')?.animate([{ transform: `scale(1.1) translate3d(${direction * 4}%, 0, 0)` }, { transform: 'none' }], SWEEP.settle);
    outgoing?.animate([{ transform: 'none', opacity: 1 }, { transform: `translate3d(${-direction * 28}%, 0, 0) scale(0.94)`, opacity: 0.2 }], SWEEP.slide)
      .finished.then(() => { if (tour.current() !== from) outgoing.hidden = true; }, () => undefined);
  };

  show(tour.current(), -1);
  tour.on(show);
  root.classList.add('is-live');
  return () => { enabled = false; };
}
