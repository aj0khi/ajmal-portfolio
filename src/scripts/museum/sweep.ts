// Motion tokens for the room-to-room sweep, shared by the 3D hall and the pocket guide.
// The curve starts at speed, so the room answers the scroll on the first frame, then takes
// its time settling: the long tail is what makes it read as heavy, framed, and expensive.
const curve = 'cubic-bezier(0.45, 0, 0.1, 1)';

export const SWEEP = {
  // The incoming room crossing the screen while the old one recedes under it.
  slide: { duration: 950, easing: curve, fill: 'both' } satisfies KeyframeAnimationOptions,
  // The arrival carrying on after the slide lands: an image settling, the camera drifting in.
  settle: { duration: 1700, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'both' } satisfies KeyframeAnimationOptions,
  // How far (metres, along the wall) the camera drifts after the cut, for parallax.
  drift: 1.3
};
