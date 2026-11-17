import {Node} from '@motion-canvas/2d';
import {Vector2, createSignal, all, TimingFunction, ThreadGenerator} from '@motion-canvas/core';
import {WORLD} from './world';
/** A layer node bound to a parallax factor. */
export interface ParallaxLayer {
  node: Node;
  factor: number;
}

/**
 * Manual deterministic camera rig.
 *
 * The rig stores focus (cx, cy) and zoom as plain signals. Every parallax
 * layer maps world space to screen space with its own factor:
 *
 *   screen = center + factor * zoom * (world - focus)
 *
 * factor < 1 paints distant layers (they move slower); factor > 1 is the
 * foreground. Layer transforms are reactive derived signals, so the whole
 * scene updates coherently while cx / cy / zoom are tweened - no per-frame
 * imperative updates, no wall-clock dependence, fully deterministic.
 */
export class CameraRig {
  public readonly cx = createSignal<number>(WORLD.centerX);
  public readonly cy = createSignal<number>(WORLD.centerY);
  public readonly zoom = createSignal<number>(1);

  private readonly layers: ParallaxLayer[] = [];

  /** Bind a layer node; call once after all layers are built.
   *
   * Motion Canvas 2D places the view origin at the CANVAS CENTER, so each
   * layer must hold its world-space children inside an inner node offset
   * by (-540, -960) (see worldLayer() in the scene). The layer transform
   * then maps world space to pixels as: pixel = C + z*f*(world - camera).
   */
  public bind(layer: ParallaxLayer): void {
    this.layers.push(layer);
    const f = layer.factor;
    layer.node.scale(() => this.zoom() * f);
    layer.node.position(() => {
      const zf = this.zoom() * f;
      return new Vector2(zf * (WORLD.centerX - this.cx()), zf * (WORLD.centerY - this.cy()));
    });
  }

  /** Absolute move (duration in seconds). */
  public *moveTo(x: number, y: number, time: number, ease: TimingFunction): ThreadGenerator {
    yield* all(this.cx(x, time, ease), this.cy(y, time, ease));
  }

  /** Absolute zoom. */
  public *zoomTo(z: number, time: number, ease: TimingFunction): ThreadGenerator {
    yield* this.zoom(z, time, ease);
  }

  /** Move + zoom in one motion. */
  public *flyTo(
    x: number,
    y: number,
    z: number,
    time: number,
    ease: TimingFunction,
  ): ThreadGenerator {
    yield* all(this.cx(x, time, ease), this.cy(y, time, ease), this.zoom(z, time, ease));
  }
}
