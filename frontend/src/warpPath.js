// Shared flight path for the warp spaceship, used by both the 3D ship and the
// 2D star field / sound so they stay perfectly in sync.
// p in [0,1] -> normalized screen position (y up) + how "near" the ship is.
export function warpShipPath(p) {
  // eased travel: enters from below the screen, sweeps up through the centre,
  // exits off the top. nx/ny are in normalized viewport units (1 = half-screen)
  // and go past ±1 so the ship is fully off-screen at both ends on any size.
  const e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2; // easeInOutQuad
  const nx = -0.55 + 1.1 * e; // gentle left -> right drift
  const ny = -1.15 + 2.3 * e; // fully below screen -> fully above
  const near = Math.sin(Math.PI * p); // 0 far, 1 near (mid), 0 far
  return { nx, ny, near };
}
