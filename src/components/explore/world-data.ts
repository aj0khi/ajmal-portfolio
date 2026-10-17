export type IslandId = 'home' | 'robotics' | 'developer';

export interface ExploreIsland {
  id: IslandId;
  label: string;
  subtitle: string;
  x: number;
  y: number;
  radiusX: number;
  radiusY: number;
  palette: { deep: string; grass: string; highlight: string };
}

export interface ExploreLandmark {
  id: string;
  island: IslandId;
  label: string;
  copy: string;
  x: number;
  y: number;
  color: string;
  href?: string;
  external?: boolean;
  worldX?: number;
  worldZ?: number;
}

export interface ExploreOrb {
  id: string;
  island: IslandId;
  label: string;
  worldX: number;
  worldZ: number;
}

export interface ExploreSecret {
  id: string;
  island: IslandId;
  label: string;
  copy: string;
  worldX: number;
  worldZ: number;
}

export const WORLD = { width: 5200, height: 1300 };

export const ISLANDS: ExploreIsland[] = [
  { id: 'home', label: 'HOME ISLAND', subtitle: 'Profile / quick navigation', x: 700, y: 800, radiusX: 620, radiusY: 280, palette: { deep: '#209b86', grass: '#6bd17c', highlight: '#a7ed87' } },
  { id: 'robotics', label: 'ROBOTICS ISLAND', subtitle: 'WayBionic / ROS 2 / motion', x: 2750, y: 760, radiusX: 570, radiusY: 255, palette: { deep: '#167f95', grass: '#4fc7a4', highlight: '#a2f1bb' } },
  { id: 'developer', label: 'DEVELOPER ISLAND', subtitle: 'Code / tools / GitHub', x: 4600, y: 790, radiusX: 510, radiusY: 240, palette: { deep: '#287d9b', grass: '#54bd8c', highlight: '#b7f29a' } }
];

export const LANDMARKS: ExploreLandmark[] = [
  { id: 'portfolio-terminal', island: 'home', label: 'PORTFOLIO TERMINAL', copy: 'Profile, introduction and quick navigation', x: 560, y: 815, worldX: -6.2, worldZ: 0.2, color: '#fff7bc', href: '/' },
  { id: 'projects-gateway', island: 'home', label: 'PROJECTS GATEWAY', copy: 'Open real coding, robotics and systems projects', x: 820, y: 780, worldX: 0, worldZ: -3.4, color: '#8df7e4', href: '/' },
  { id: 'contact-station', island: 'home', label: 'CONTACT STATION', copy: 'Email, LinkedIn and Google Scholar', x: 1040, y: 820, worldX: 6.1, worldZ: 0.5, color: '#c6ff9a', href: 'mailto:khidri.ajmal@gmail.com' },
  { id: 'waybionic', island: 'robotics', label: 'WAYBIONIC STATION', copy: 'ROS 2 ground station and diagnostics', x: 2550, y: 785, color: '#8df7e4', href: '/' },
  { id: 'motion-lab', island: 'robotics', label: 'MOTION LAB', copy: 'Simulated arm controls and engineering notes', x: 2960, y: 680, color: '#c6ff9a', href: '/' },
  { id: 'github', island: 'developer', label: 'GITHUB TERMINAL', copy: 'Open Ajmal Khidri public repositories', x: 4420, y: 800, color: '#fff7bc', href: 'https://github.com/aj0khi', external: true },
  { id: 'tool-bench', island: 'developer', label: 'TOOL BENCH', copy: 'Java, Python, JavaScript, ROS 2 and more', x: 4780, y: 700, color: '#8df7e4', href: '/' }
];

export const spawn = { x: 560, y: 815 };

export const AERO_ORBS: ExploreOrb[] = [
  { id: 'home-orb-01', island: 'home', label: 'Horizon Orb', worldX: -9.8, worldZ: 1.8 },
  { id: 'home-orb-02', island: 'home', label: 'Canopy Orb', worldX: -7.3, worldZ: -3.8 },
  { id: 'home-orb-03', island: 'home', label: 'Glass Garden Orb', worldX: -3.8, worldZ: 4.2 },
  { id: 'home-orb-04', island: 'home', label: 'Tide Orb', worldX: -1.2, worldZ: 5.1 },
  { id: 'home-orb-05', island: 'home', label: 'Meadow Orb', worldX: 2.7, worldZ: 4.4 },
  { id: 'home-orb-06', island: 'home', label: 'Signal Orb', worldX: 4.3, worldZ: -4.2 },
  { id: 'home-orb-07', island: 'home', label: 'Cloud Orb', worldX: 7.8, worldZ: -2.7 },
  { id: 'home-orb-08', island: 'home', label: 'Terminal Orb', worldX: 9.1, worldZ: 1.4 },
  { id: 'home-orb-09', island: 'home', label: 'Stone Orb', worldX: 5.2, worldZ: 3.6 },
  { id: 'home-orb-10', island: 'home', label: 'Aero Core Orb', worldX: 0.8, worldZ: 0.2 }
];

export const SECRETS: ExploreSecret[] = [
  { id: 'hidden-grotto', island: 'home', label: 'Hidden Grotto', copy: 'A quiet glass cove beneath the home island rewards curious explorers.', worldX: -10.8, worldZ: -3.8 },
  { id: 'developer-easter-egg', island: 'home', label: 'Developer Signal', copy: 'A tiny terminal nods to AjmalOS, GitHub, and the command-line archive.', worldX: 8.8, worldZ: -4.8 },
  { id: 'waybionic-detail', island: 'home', label: 'WayBionic Detail', copy: 'The archive keeps movement tests simulated and RViz-only until direct hardware control is ready.', worldX: 3.2, worldZ: -0.8 }
];
