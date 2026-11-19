// The museum tour: which room shows what, in walking order. Screenshots were captured from
// each project running locally (or the live site) on 2026-11-18; RViz captures are mock states.

export type Sculpture = 'waybionic-arm' | 'motor-bus' | 'hash-chain' | 'snake' | 'rover' | 'moon' | 'wash' | 'barrier';
export type Kiosk = 'stale-lab' | 'motor-bus' | 'hash-chain' | 'snake-lab' | 'rover-sim' | 'poisson' | 'signature' | 'hvac';
export type Control = 'arm' | 'sun' | 'wash' | 'tamper';

export interface Painting {
  src: string;
  alt: string;
  caption: string;
}

export interface Exhibit {
  id: string; // content collection id
  accession: string;
  wall: string; // wall lettering, lines split by |
  sculpture?: Sculpture;
  paintings?: Painting[];
  kiosk?: Kiosk;
  kioskTitle?: string;
  control?: Control;
}

export const tour: Exhibit[] = [
  {
    id: 'waybionic-ground-station',
    accession: 'AK.2026.01',
    wall: 'WayBionic|ground station',
    sculpture: 'waybionic-arm',
    paintings: [
      { src: '/exhibits/rviz-normal.webp', alt: 'The WayBionic engineering monitor in RViz with diagnostics in a mock normal state.', caption: 'Engineering monitor, mock normal state' },
      { src: '/exhibits/rviz-fault.webp', alt: 'The WayBionic engineering monitor in RViz flagging a mock fault and stale joint data.', caption: 'Same monitor, mock fault and stale state' }
    ],
    kiosk: 'stale-lab',
    kioskTitle: 'When fresh data goes stale',
    control: 'arm'
  },
  {
    id: 'rover-arm-motors',
    accession: 'AK.2026.02',
    wall: 'Rover arm|on one bus',
    sculpture: 'motor-bus',
    kiosk: 'motor-bus',
    kioskTitle: 'Plan the arm bus'
  },
  {
    id: 'physical-ai-blackbox',
    accession: 'AK.2026.03',
    wall: 'Physical AI|BlackBox',
    sculpture: 'hash-chain',
    kiosk: 'hash-chain',
    kioskTitle: 'Change one record',
    control: 'tamper'
  },
  {
    id: 'teach-to-game',
    accession: 'AK.2026.04',
    wall: 'Teach|to Game',
    sculpture: 'snake',
    paintings: [{ src: '/exhibits/teach-to-game.webp', alt: 'Teach to Game dashboard mid-run: Snake environment, PPO strategy, attempts, best score, and a live game view.', caption: 'The live lab during a PPO run' }],
    kiosk: 'snake-lab',
    kioskTitle: 'Train a policy yourself'
  },
  {
    id: 'autonomous-rover',
    accession: 'AK.HS.01',
    wall: 'The rover|that noticed',
    sculpture: 'rover',
    kiosk: 'rover-sim',
    kioskTitle: 'Drop an obstacle'
  },
  {
    id: 'southpoint',
    accession: 'AK.2026.05',
    wall: 'SouthPoint',
    sculpture: 'moon',
    paintings: [{ src: '/exhibits/southpoint.webp', alt: 'SouthPoint landing page: Lunar Landing Site Navigator over an image of the Moon’s south pole.', caption: 'SouthPoint, running locally' }],
    control: 'sun'
  },
  {
    id: 'soccer-intelligence',
    accession: 'AK.2026.06',
    wall: 'Second|Story',
    paintings: [{ src: '/exhibits/soccer.webp', alt: 'Soccer Intelligence Lab studio view: a synthetic match, an evidence-backed read that Aston are controlling the match, and supporting metrics.', caption: 'Studio view on a synthetic match' }],
    kiosk: 'poisson',
    kioskTitle: 'Expected goals in, outcomes out'
  },
  {
    id: 'aircade',
    accession: 'AK.2026.07',
    wall: 'Aircade',
    paintings: [
      { src: '/exhibits/aircade-menu.webp', alt: 'Aircade cabinet select screen with Pong, Snake, Aircade Bowling, Breakout, and Neon Tanks.', caption: 'Choose a cabinet' },
      { src: '/exhibits/aircade-bowling.webp', alt: 'Aircade Bowling in 3D, with motion controls and keyboard fallback.', caption: 'Aircade Bowling, keyboard fallback' }
    ]
  },
  {
    id: 'proofly',
    accession: 'AK.2026.08',
    wall: 'Proofly',
    paintings: [
      { src: '/exhibits/proofly.webp', alt: 'Proofly student workspace showing a signed credential and community projects, with fictional demo data.', caption: 'Student workspace, fictional demo data' },
      { src: '/exhibits/proofly-map.webp', alt: 'Proofly map of nearby community projects in Calgary.', caption: 'Projects near you' }
    ],
    kiosk: 'signature',
    kioskTitle: 'Sign it, then tamper with it'
  },
  {
    id: 'hvac-express',
    accession: 'AK.2024.01',
    wall: 'HVAC|Express',
    paintings: [{ src: '/exhibits/hvac-express.webp', alt: 'HVAC Express home page: Home comfort for the way Calgary actually feels.', caption: 'calgaryhvacexpress.ca, live' }],
    kiosk: 'hvac',
    kioskTitle: 'Comfort, calculated'
  },
  {
    id: 'chinook-clean',
    accession: 'AK.2024.02',
    wall: 'Chinook|Clean',
    sculpture: 'wash',
    control: 'wash'
  }
];
