// Simulation constants shared by the 3D modules.

// x y z size rot r g b a vx vy vz | life fraction, stable random 0..1, age (s)
/** Floats per particle: see sim3d/output.ts pushParticle. */
export const STRIDE3 = 19;
export const GRAVITY = -9.81;
export const DT = 1 / 60;
export const TRAIL_STEP = 2; // record a trail point every 2 integration steps (30 Hz)
export const MAX_TRAIL_POINTS = 48;
