// The DOM half of the journey: each stop's card and the trip meter. Cards get one number,
// `--show` (0..1), and their children stagger themselves in CSS, so text rises in reading
// order as the rover parks and sinks back when you scroll away.
import { stops } from '../../data/journey';
import type { JourneyScroll } from './scroll';
import { smoothstep } from './util';

const kmFormat = new Intl.NumberFormat('en-CA', { maximumFractionDigits: 0 });
const kmFine = new Intl.NumberFormat('en-CA', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

export function createUi(root: HTMLElement, scroll: JourneyScroll) {
  const cards = stops.map((stop) => root.querySelector<HTMLElement>(`[data-card="${stop.id}"]`));
  const km = root.querySelector<HTMLElement>('[data-km]');
  const stopButtons = [...root.querySelectorAll<HTMLButtonElement>('[data-go]')];
  const scrim = root.querySelector<HTMLElement>('[data-scrim]');
  const flash = root.querySelector<HTMLElement>('[data-flash]');
  const cue = root.querySelector<HTMLElement>('[data-cue]');
  const stopName = root.querySelector<HTMLElement>('[data-stop-name]');

  // Every card starts hidden and unreachable; update() opens the one the rover is parked at.
  cards.forEach((card) => { if (card) card.inert = true; });
  // A card taller than the screen scrolls inside itself; only those keep the wheel from Lenis.
  // Card heights are kept too: on tall screens the scene shifts up by about half the card.
  let heights: number[] = [];
  const measureCards = () => {
    cards.forEach((card) => card?.toggleAttribute('data-lenis-prevent', card.scrollHeight > card.clientHeight + 1));
    heights = cards.map((card) => card?.offsetHeight ?? 0);
  };
  measureCards();
  addEventListener('resize', measureCards);
  stopButtons.forEach((button) => button.addEventListener('click', () => scroll.goToStop(Number(button.dataset.go))));
  root.querySelectorAll<HTMLElement>('[data-next]').forEach((button) => button.addEventListener('click', () => scroll.goToStop(Number(button.dataset.next))));

  let shownStop = -1;
  let lastKm = '';
  return {
    // Returns how present the current card is and how tall it is, so the scene can make room.
    update(flashAmount: number, kilometres: number) {
      const time = scroll.timeline.time();
      let presence = 0;
      let height = 0;
      cards.forEach((card, i) => {
        const [arrive, leave] = scroll.dwellTimes[i];
        const away = Math.max(0, arrive - time, time - leave);
        const show = 1 - smoothstep(0.06, 0.5, away);
        if (show > presence) { presence = show; height = heights[i] ?? 0; }
        if (i === 0) cue?.style.setProperty('--show', show.toFixed(3));
        if (!card) return;
        card.style.setProperty('--show', show.toFixed(3));
        const live = show > 0.5;
        if (card.classList.contains('is-live') !== live) { card.classList.toggle('is-live', live); card.inert = !live; }
      });
      scrim?.style.setProperty('--show', presence.toFixed(3));
      if (flash) flash.style.opacity = flashAmount.toFixed(3);

      const text = kilometres < 100 ? kmFine.format(kilometres) : kmFormat.format(kilometres);
      if (km && text !== lastKm) { km.textContent = text; lastKm = text; }
      const stop = scroll.stopAt();
      if (stop !== shownStop) {
        shownStop = stop;
        stopButtons.forEach((button, i) => { if (i === stop) button.setAttribute('aria-current', 'step'); else button.removeAttribute('aria-current'); });
        if (stopName) stopName.textContent = stops[stop].name;
      }
      return { presence, height };
    }
  };
}
