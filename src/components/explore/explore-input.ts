export interface ExploreInputState {
  x: number;
  y: number;
  menu: boolean;
  paused: boolean;
  interact: boolean;
}

export class ExploreInput {
  readonly state: ExploreInputState = { x: 0, y: 0, menu: false, paused: false, interact: false };
  private readonly keys = new Set<string>();
  private readonly target: HTMLElement;
  private readonly onMenuToggle?: (open: boolean) => void;
  private readonly onKeyDown = (event: KeyboardEvent) => {
    const active = document.activeElement;
    if (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement || active instanceof HTMLSelectElement || active?.getAttribute('contenteditable') === 'true') return;
    const key = event.key.toLowerCase();
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd', 'escape', 'e'].includes(key)) {
      event.preventDefault();
      this.keys.add(key);
      if (key === 'escape') {
        if (!this.state.paused) {
          this.state.menu = !this.state.menu;
          this.onMenuToggle?.(this.state.menu);
        }
      }
      if (key === 'e' && !this.state.paused) this.state.interact = true;
    }
  };
  private readonly onKeyUp = (event: KeyboardEvent) => this.keys.delete(event.key.toLowerCase());
  private readonly onBlur = () => this.keys.clear();
  private readonly onVisibility = () => { if (document.hidden) this.keys.clear(); };
  private readonly onPointerDown = () => this.target.focus();

  constructor(target: HTMLElement, onMenuToggle?: (open: boolean) => void) {
    this.target = target;
    this.onMenuToggle = onMenuToggle;
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.onBlur);
    document.addEventListener('visibilitychange', this.onVisibility);
    target.addEventListener('pointerdown', this.onPointerDown, { passive: true });
  }

  update() {
    this.state.x = Number(this.keys.has('arrowright') || this.keys.has('d')) - Number(this.keys.has('arrowleft') || this.keys.has('a'));
    this.state.y = Number(this.keys.has('arrowdown') || this.keys.has('s')) - Number(this.keys.has('arrowup') || this.keys.has('w'));
  }

  consumeInteract() {
    const interact = this.state.interact;
    this.state.interact = false;
    return interact;
  }

  press(direction: 'up' | 'down' | 'left' | 'right') {
    this.keys.add({ up: 'arrowup', down: 'arrowdown', left: 'arrowleft', right: 'arrowright' }[direction]);
  }

  release(direction: 'up' | 'down' | 'left' | 'right') {
    this.keys.delete({ up: 'arrowup', down: 'arrowdown', left: 'arrowleft', right: 'arrowright' }[direction]);
  }

  clear() {
    this.keys.clear();
    this.state.x = 0;
    this.state.y = 0;
    this.state.interact = false;
  }

  setMenu(open: boolean) {
    if (this.state.menu === open) return;
    this.state.menu = open;
    this.onMenuToggle?.(open);
  }

  setPaused(paused: boolean) {
    this.state.paused = paused;
    if (paused) this.clear();
  }

  destroy() {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('blur', this.onBlur);
    document.removeEventListener('visibilitychange', this.onVisibility);
    this.target.removeEventListener('pointerdown', this.onPointerDown);
  }
}
