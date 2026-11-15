// three.js render layers of the preview. The depth pre-pass for soft
// particles sees only OPAQUE and GROUND_DEPTH; the main pass sees all but GROUND_DEPTH.

/** Solid scene geometry (the stand-in character). */
export const OPAQUE_LAYER = 0;
/** Particles and trails. */
export const FX_LAYER = 1;
/** Editor helpers: grid and shape gizmo (lines must not write into the depth pre-pass). */
export const HELPER_LAYER = 2;
/** Invisible ground, seen only by the depth pre-pass, so soft particles fade at y = 0 like on a Unity floor. */
export const GROUND_DEPTH_LAYER = 3;
/** Selected layers' particles while they are drawn into the selection-outline mask. */
export const SELECT_LAYER = 4;
