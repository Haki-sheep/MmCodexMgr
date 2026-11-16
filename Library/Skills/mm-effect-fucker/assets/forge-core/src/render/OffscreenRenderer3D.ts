// One shared, off-screen 3D renderer for thumbnails and agent screenshots, so
// background workspaces never need a WebGL context of their own.

import { Preview3D } from '../engine/preview3d';
import type { Effect3D } from '../engine/types3d';

export interface CameraView {
  position: [number, number, number];
  target: [number, number, number];
}

/** Matches the default viewport camera. */
export const DEFAULT_VIEW: CameraView = { position: [5, 3.4, 7.2], target: [0, 1, 0] };

class OffscreenRenderer3D {
  private preview: Preview3D | null = null;
  private canvas = document.createElement('canvas');

  /**
   * Renders one frame and returns a copy of the image (width x height).
   * `supersample` renders at that many times the size and scales the finished
   * (clamped, sRGB) image down, the way a game screenshot or Unity's verify
   * render looks when shown small: thin over-bright (HDR) streaks clip to white
   * at the higher resolution instead of being averaged with the background
   * before the clamp.
   */
  render(effect: Effect3D, t: number, view: CameraView, width: number, height: number, supersample = 1): HTMLCanvasElement {
    const p = this.ensure();
    const k = Math.max(1, Math.round(supersample));
    p.setSize(width * k, height * k);
    p.camera.position.set(...view.position);
    p.controls.target.set(...view.target);
    p.controls.update();
    p.render(effect, t, null);
    const out = document.createElement('canvas');
    out.width = Math.round(this.canvas.width / k);
    out.height = Math.round(this.canvas.height / k);
    out.getContext('2d')!.drawImage(this.canvas, 0, 0, out.width, out.height);
    return out;
  }

  /** The shared WebGL renderer (e.g. to compile-check shaders without a second context). */
  webgl() {
    return this.ensure().renderer;
  }

  private ensure(): Preview3D {
    if (!this.preview) {
      this.preview = new Preview3D(this.canvas);
      this.preview.renderer.setPixelRatio(1);
      this.preview.controls.enableDamping = false;
      this.preview.controls.enabled = false;
    }
    return this.preview;
  }
}

export const offscreen3D = new OffscreenRenderer3D();
