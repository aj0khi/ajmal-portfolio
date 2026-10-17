import type { ExploreOrb, ExploreSecret } from './world-data';

export interface ExploreProgressState {
  collectedOrbIds: string[];
  discoveredSecretIds: string[];
  bonusIslandUnlocked: boolean;
  completed: boolean;
}

const STORAGE_KEY = 'ajmalos-aero-progress-v1';

const emptyState = (): ExploreProgressState => ({
  collectedOrbIds: [],
  discoveredSecretIds: [],
  bonusIslandUnlocked: false,
  completed: false
});

export class ExploreProgress {
  private state: ExploreProgressState;
  private readonly listeners = new Set<(state: ExploreProgressState) => void>();
  readonly storageAvailable: boolean;

  constructor() {
    this.storageAvailable = this.canUseStorage();
    this.state = this.load();
  }

  get snapshot() {
    return { ...this.state, collectedOrbIds: [...this.state.collectedOrbIds], discoveredSecretIds: [...this.state.discoveredSecretIds] };
  }

  subscribe(listener: (state: ExploreProgressState) => void) {
    this.listeners.add(listener);
    listener(this.snapshot);
    return () => this.listeners.delete(listener);
  }

  collect(orb: ExploreOrb) {
    if (this.state.collectedOrbIds.includes(orb.id)) return false;
    this.state.collectedOrbIds = [...this.state.collectedOrbIds, orb.id];
    this.state.bonusIslandUnlocked = this.state.bonusIslandUnlocked || this.state.collectedOrbIds.length >= 5;
    this.state.completed = this.state.collectedOrbIds.length >= 10;
    this.commit();
    return true;
  }

  discover(secret: ExploreSecret) {
    if (this.state.discoveredSecretIds.includes(secret.id)) return false;
    this.state.discoveredSecretIds = [...this.state.discoveredSecretIds, secret.id];
    this.commit();
    return true;
  }

  reset() {
    this.state = emptyState();
    this.commit();
  }

  private canUseStorage() {
    try {
      const key = `${STORAGE_KEY}-probe`;
      localStorage.setItem(key, '1');
      localStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  }

  private load() {
    if (!this.storageAvailable) return emptyState();
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return emptyState();
      const parsed = JSON.parse(raw) as Partial<ExploreProgressState>;
      const collectedOrbIds = Array.isArray(parsed.collectedOrbIds) ? parsed.collectedOrbIds.filter((id): id is string => typeof id === 'string') : [];
      const discoveredSecretIds = Array.isArray(parsed.discoveredSecretIds) ? parsed.discoveredSecretIds.filter((id): id is string => typeof id === 'string') : [];
      return {
        collectedOrbIds,
        discoveredSecretIds,
        bonusIslandUnlocked: collectedOrbIds.length >= 5 || parsed.bonusIslandUnlocked === true,
        completed: collectedOrbIds.length >= 10 || parsed.completed === true
      };
    } catch {
      return emptyState();
    }
  }

  private commit() {
    if (this.storageAvailable) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
      } catch {
        // Progress remains available for this session when storage is unavailable.
      }
    }
    const snapshot = this.snapshot;
    this.listeners.forEach((listener) => listener(snapshot));
  }
}
