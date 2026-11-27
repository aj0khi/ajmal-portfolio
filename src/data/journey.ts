// The journey's source of truth: every stop, how much scroll it takes, where it sits on the
// road, and how the camera frames it. Tune feel here, not in the scene code.

export type StopId =
  | 'home' | 'chinook' | 'hvac' | 'thread'
  | 'societies' | 'waybionic' | 'blackbox' | 'lounge' | 'soccer'
  | 'garage' | 'mars' | 'launch'
  | 'southpoint' | 'next';

export interface Framing {
  yaw: number; // radians around the rover: 0 behind, PI/2 its right side, PI in front, negative to its left
  pitch: number; // radians above the rover
  distance: number;
  lift: number; // how high above the rover the camera aims
  ahead: number; // how far past the rover, down the road, the camera aims
  toward: number; // how far to the rover's right (negative: left) the camera aims, toward the site
  fov: number; // lens, in degrees of vertical view: wider where something tall has to fit
}

export interface JourneyStop {
  id: StopId;
  name: string; // the trip meter's label
  world: 'earth' | 'moon';
  at: number; // metres along that world's road where the rover parks; negative counts back from the end
  drive: number; // screens of scroll to arrive here from the previous stop
  dwell: number; // screens of scroll parked here, where the stop is live
  glide: number; // seconds one gesture takes to drive here from the previous stop
  framing: Framing;
  sky: number; // time of day: 0 pre-dawn, 1 Chinook dawn, 2 morning, 3 noon, 4 dusk
}

// Framing rule of thumb: a site on the road's left is seen from the rover's front-right
// (yaw ~2.4); a site on the right from behind-left, looking ahead (yaw ~-0.85). Either way the
// site lands right of the rover on screen, clear of the card on the left, and the camera aims
// part of the way toward it so the scene sliding aside for the card doesn't push it off-screen.
const left = (distance = 15, lift = 2.4, pitch = 0.2, toward = -7): Framing => ({ yaw: 2.4, pitch, distance, lift, ahead: 0, toward, fov: 42 });
const right = (distance = 16, lift = 3, pitch = 0.2, ahead = 6, toward = 7): Framing => ({ yaw: -0.85, pitch, distance, lift, ahead, toward, fov: 42 });

export const stops: JourneyStop[] = [
  { id: 'home', name: 'Home', world: 'earth', at: 8, drive: 0, dwell: 1, glide: 0, framing: { yaw: 2.5, pitch: 0.18, distance: 15, lift: 1.8, ahead: 0, toward: 0, fov: 42 }, sky: 0 },
  { id: 'chinook', name: 'Chinook Clean', world: 'earth', at: 40, drive: 1, dwell: 0.8, glide: 1.5, framing: left(12, 0.6, 0.5, -6), sky: 0.25 },
  { id: 'hvac', name: 'HVAC Express', world: 'earth', at: 92, drive: 1.2, dwell: 0.8, glide: 1.7, framing: right(19, 4.5, 0.2, 3, 2), sky: 0.7 },
  // Downtown: the road signs with the Calgary Tower behind them, then the Saddledome.
  { id: 'thread', name: 'The thread', world: 'earth', at: 190, drive: 1.4, dwell: 0.8, glide: 2, framing: { yaw: -0.5, pitch: 0.05, distance: 14, lift: 11, ahead: 60, toward: 20, fov: 52 }, sky: 1.15 },
  { id: 'soccer', name: 'Soccer Lab', world: 'earth', at: 245, drive: 1.1, dwell: 0.8, glide: 1.6, framing: right(30, 6, 0.3, 14, 26), sky: 1.5 },
  // Campus: the University of Calgary.
  { id: 'societies', name: 'Societies', world: 'earth', at: 305, drive: 1.2, dwell: 0.8, glide: 1.8, framing: { yaw: 0.22, pitch: 0.14, distance: 19, lift: 4, ahead: 12, toward: 0, fov: 42 }, sky: 1.9 },
  { id: 'waybionic', name: 'WayBionic', world: 'earth', at: 352, drive: 1.1, dwell: 0.8, glide: 1.6, framing: left(24, 4, 0.2, -12), sky: 2.05 },
  { id: 'blackbox', name: 'BlackBox', world: 'earth', at: 390, drive: 1, dwell: 0.8, glide: 1.5, framing: right(14, 1.8, 0.25, 2, 8), sky: 2.15 },
  { id: 'lounge', name: 'Arcade', world: 'earth', at: 432, drive: 1, dwell: 0.8, glide: 1.5, framing: left(22, 3, 0.18, -12), sky: 2.3 },
  { id: 'garage', name: 'Rover garage', world: 'earth', at: 560, drive: 1.4, dwell: 0.8, glide: 2, framing: left(20, 2.6, 0.16, -11), sky: 2.9 },
  { id: 'mars', name: 'Mars yard', world: 'earth', at: 640, drive: 1.3, dwell: 0.8, glide: 1.9, framing: right(22, 3, 0.26, 4, 14), sky: 3.3 },
  { id: 'launch', name: 'Launch pad', world: 'earth', at: -14, drive: 1.5, dwell: 0.9, glide: 2.1, framing: { yaw: 2.2, pitch: 0.1, distance: 75, lift: 16, ahead: 14, toward: 0, fov: 42 }, sky: 4 },
  // The landing is framed by the flight storyboard, not the rover rig. A long drive and a
  // slow glide, so one gesture from the pad plays the whole flight at a watchable pace.
  { id: 'southpoint', name: 'SouthPoint', world: 'moon', at: 0, drive: 7.5, dwell: 1, glide: 8, framing: { yaw: 0, pitch: 0, distance: 0, lift: 0, ahead: 0, toward: 0, fov: 42 }, sky: 4 },
  { id: 'next', name: 'The next wing', world: 'moon', at: 46, drive: 1.3, dwell: 1.2, glide: 2.4, framing: { yaw: 0.55, pitch: 0.1, distance: 13, lift: 7, ahead: 24, toward: -4, fov: 42 }, sky: 4 }
];

// The stop the rocket flies to: the drive into it is the launch storyboard.
export const FLIGHT = stops.findIndex((stop) => stop.id === 'southpoint');

// How the camera rides behind the rover between stops: a little to its right, looking ahead.
export const follow: Framing = { yaw: 0.3, pitch: 0.3, distance: 11, lift: 1.2, ahead: 9, toward: 0, fov: 42 };

// The launch storyboard (docs/09-JOURNEY-PLAN.md, section 2b), as fractions of the
// launch-to-Moon drive. Every beat is a pure function of this fraction, so scrolling back
// rewinds the whole flight, cuts included.
export const flight = {
  boarded: 0.08, // the rover is inside the rocket
  ignited: 0.15, // full thrust, lift-off
  cloudsIn: 0.4, // whiteout starts building
  toSpace: 0.46, // cut 1, at the whiteout's peak
  cloudsOut: 0.52,
  toMoon: 0.82, // cut 2, matched on the Moon's grey surface
  landed: 0.93,
  ascentHeight: 900, // metres the rocket climbs before the cut
  cloudDeck: 720
};

// The odometer: kilometres per metre of road on the ground, then low orbit, then the Moon.
export const odometer = { perMetre: 0.03, orbit: 420, moon: 384_400 };
