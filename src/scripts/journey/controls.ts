// The cards' controls and the kiosks. Controls are plain HTML in each stop's card:
//   <input type="range" data-control="key">       a value, sent on every change
//   <button data-control="key" data-hold>          1 while held (pointer, Space or Enter), 0 on release
//   <button data-control="key">, <a data-control>  1 on click
// Each is routed to the stop whose card holds it. Kiosks are native modal dialogs: focus is
// trapped, Escape closes them, and closing plays a short exit first.
import type { StopId } from '../../data/journey';

type Send = (stop: StopId, key: string, value: number) => void;

export function wireControls(root: HTMLElement, send: Send) {
  root.querySelectorAll<HTMLElement>('[data-card] [data-control]').forEach((element) => {
    const stop = element.closest<HTMLElement>('[data-card]')!.dataset.card as StopId;
    const key = element.dataset.control!;
    if (element instanceof HTMLInputElement) {
      const readout = element.closest('label')?.querySelector<HTMLElement>('[data-readout]');
      // Readouts can rescale (radians shown as degrees) and carry a unit.
      const show = () => {
        if (!readout) return;
        const scale = Number(readout.dataset.scale ?? 1);
        const value = Number(element.value) * scale;
        readout.textContent = `${value.toFixed(scale !== 1 ? 0 : Number(element.step) < 1 ? 1 : 0)}${readout.dataset.unit ?? ''}`;
      };
      element.addEventListener('input', () => { send(stop, key, Number(element.value)); show(); });
      show();
      return;
    }
    if (element.hasAttribute('data-hold')) {
      const press = (on: boolean) => { send(stop, key, on ? 1 : 0); element.classList.toggle('is-held', on); };
      element.addEventListener('pointerdown', (event) => {
        if (!event.isPrimary || event.button !== 0) return; // right-clicks open a menu, not the tool
        element.setPointerCapture(event.pointerId);
        press(true);
      });
      ['pointerup', 'pointercancel', 'lostpointercapture', 'contextmenu', 'blur'].forEach((type) => element.addEventListener(type, () => press(false)));
      element.addEventListener('keydown', (event) => { if ((event.key === ' ' || event.key === 'Enter') && !event.repeat) { event.preventDefault(); press(true); } });
      element.addEventListener('keyup', (event) => { if (event.key === ' ' || event.key === 'Enter') press(false); });
      return;
    }
    element.addEventListener('click', () => send(stop, key, 1));
  });
}

export function wireKiosks(root: Document | HTMLElement, onOpen: (open: boolean) => void) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const pending = new WeakMap<HTMLDialogElement, () => void>();
  const settle = (dialog: HTMLDialogElement) => { pending.get(dialog)?.(); dialog.classList.remove('is-closing'); };
  const finish = (dialog: HTMLDialogElement) => { settle(dialog); if (dialog.open) dialog.close(); };
  const dismiss = (dialog: HTMLDialogElement) => {
    // A second close request mid-exit (double click, repeated Escape) just finishes it.
    if (reduced.matches || dialog.classList.contains('is-closing')) { finish(dialog); return; }
    dialog.classList.add('is-closing');
    // Only the dialog's own exit counts; animations ending inside it bubble up too.
    const onEnd = (event: AnimationEvent) => { if (event.target === dialog) finish(dialog); };
    const timer = window.setTimeout(() => finish(dialog), 400);
    dialog.addEventListener('animationend', onEnd);
    pending.set(dialog, () => { clearTimeout(timer); dialog.removeEventListener('animationend', onEnd); pending.delete(dialog); });
  };
  root.querySelectorAll<HTMLButtonElement>('[data-kiosk]').forEach((button) => {
    button.addEventListener('click', () => {
      const dialog = document.querySelector<HTMLDialogElement>(`#${button.dataset.kiosk}`);
      if (!dialog) return;
      dialog.showModal();
      onOpen(true);
    });
  });
  root.querySelectorAll<HTMLDialogElement>('dialog.kiosk').forEach((dialog) => {
    dialog.querySelector('[data-kiosk-close]')?.addEventListener('click', () => dismiss(dialog));
    dialog.addEventListener('click', (event) => { if (event.target === dialog) dismiss(dialog); });
    dialog.addEventListener('cancel', (event) => { event.preventDefault(); dismiss(dialog); });
    dialog.addEventListener('close', () => { settle(dialog); onOpen(false); });
  });
}
