// Shared flight path for the warp spaceship, used by both the 3D ship and the
// 2D star field / sound so they stay perfectly in sync.
// p in [0,1] -> normalized screen position (y up) + how "near" the ship is.
export function warpShipPath(p) {
  // eased travel: enters bottom-left, sweeps through the centre, exits top-right
  const e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2; // easeInOutQuad
  const nx = -0.85 + 1.7 * e; // left -> right
  const ny = -0.7 + 1.4 * e; // bottom -> top
  const near = Math.sin(Math.PI * p); // 0 far, 1 near (mid), 0 far
  return { nx, ny, near };
}
