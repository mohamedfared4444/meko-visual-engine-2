/**
 * Shared constants of the virtual factory floor (world coordinates).
 * The camera crops into this world; the floor sits at y = FLOOR_Y.
 */
export const WORLD = {
  width: 1080, // screen width
  height: 1920, // screen height
  centerX: 540,
  centerY: 960,
  floorY: 1180,
  // Production line cells (machine centers)
  stage1: 250, // intake conveyor
  stage2: 800, // roaster
  stage3: 1350, // grinder
  stage4: 1900, // conche
  stage5: 2450, // molder
  lineEnd: 2900, // bar stack zone
} as const;

/** Belt heights (top surface of each conveyor, world y). */
export const BELT = {
  feed: 985, // stage 1 belt
  roastOut: 1000, // roaster -> grinder belt
  mold: 1010, // molder belt
  out: 1005, // outfeed belt
} as const;
