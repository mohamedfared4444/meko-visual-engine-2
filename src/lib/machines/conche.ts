import {Node, Rect, Circle, Line, Path, Gradient} from '@motion-canvas/2d';
import {Vector2, createSignal, Color} from '@motion-canvas/core';
import {PAL} from '../palette';
import {steelGradient, groundShadow} from '../shadows';

export interface Conche {
  node: Node;
  /** Chocolate level inside the tank (0..1). */
  level: ReturnType<typeof createSignal<number>>;
  /** Smoothness: 0 = grainy paste, 1 = glossy liquid (drives color+gloss). */
  smooth: ReturnType<typeof createSignal<number>>;
  /** Reactive paddle spin. */
  spin: ReturnType<typeof createSignal<number>>;
  /** World coords of the liquid surface (camera target). */
  surfaceX: number;
  surfaceY: () => number;
}

/**
 * Conching tank: cocoa paste is aerated and kneaded into smooth, glossy
 * liquid chocolate. Level, smoothness (color, swirl opacity, gloss sweep)
 * and the paddle spin are all reactive signals.
 */
export function makeConche(x: number, floorY: number): Conche {
  const w = 380;
  const h = 370;
  const bottom = -26; // tank bottom edge, relative to floor anchor
  const top = bottom - h;
  const pad = 34; // inner margin
  const innerH = h - pad * 2;

  const level = createSignal(0);
  const smooth = createSignal(0);
  const spin = createSignal(0);

  const surfaceYLocal = () => h / 2 - pad - innerH * level();

  const swirlGroup = new Node({
    y: () => surfaceYLocal() + 14,
    opacity: () => (1 - smooth()) * 0.9,
    children: [0, 120, 240].map(
      a0 =>
        new Path({
          data: 'M -64 0 A 64 64 0 0 1 64 0',
          stroke: 'rgba(255,222,180,0.5)',
          lineWidth: 6,
          rotation: () => a0 + spin() * 0.5,
          scaleY: 0.6,
        }),
    ),
  });

  const node = new Node({
    x,
    y: floorY,
    children: [
      groundShadow(w * 1.12, 44, 0.85),
      new Rect({x: -w / 2 + 30, y: -22, width: 20, height: 44, radius: 8, fill: PAL.steelDark}),
      new Rect({x: w / 2 - 30, y: -22, width: 20, height: 44, radius: 8, fill: PAL.steelDark}),
      // Tank body (clips its contents). Center = (top + bottom) / 2.
      new Rect({
        y: top + h / 2,
        width: w,
        height: h,
        radius: 30,
        fill: steelGradient(-h / 2, h / 2),
        stroke: PAL.steelDark,
        lineWidth: 2.5,
        clip: true,
        children: [
          // liquid body: bottom edge pinned to tank bottom, rises with level
          new Rect({
            width: w - 6,
            height: innerH,
            y: () => h / 2 - pad - (innerH * level()) / 2,
            scaleY: () => Math.max(0.001, level()),
            fill: () => Color.lerp(new Color(PAL.paste), new Color(PAL.liquid), smooth()),
          }),
          // surface sheen ellipse follows the liquid top
          new Circle({
            width: w - 40,
            height: 46,
            scaleY: 0.42,
            y: surfaceYLocal,
            fill: () => Color.lerp(new Color(PAL.pasteHi), new Color('#2E1708'), smooth()),
          }),
          // gloss sweep across the surface (appears as chocolate smooths)
          new Circle({
            width: 190,
            height: 26,
            scaleY: 0.5,
            x: () => -w / 2 + 120 + smooth() * (w - 150),
            y: surfaceYLocal,
            fill: new Gradient({
              type: 'linear',
              from: {x: -95, y: 0},
              to: {x: 95, y: 0},
              stops: [
                {offset: 0, color: 'rgba(255,224,186,0)'},
                {offset: 0.5, color: 'rgba(255,224,186,0.55)'},
                {offset: 1, color: 'rgba(255,224,186,0)'},
              ],
            }),
            opacity: () => smooth(),
          }),
          swirlGroup,
        ],
      }),
      // accent band
      new Rect({y: top + 12, width: w, height: 14, radius: 7, fill: PAL.accent4}),
      // Paddle drive on top
      new Rect({
        y: top - 34,
        width: 120,
        height: 64,
        radius: 14,
        fill: PAL.steelLo,
        stroke: PAL.steelDark,
        lineWidth: 2.5,
      }),
      new Node({
        rotation: () => spin(),
        children: [
          new Line({
            points: [new Vector2(0, top + 26), new Vector2(0, top - 34)],
            stroke: PAL.steelDark,
            lineWidth: 10,
          }),
        ],
      }),
      new Node({
        children: [
          new Line({
            points: [new Vector2(0, top + 60), new Vector2(0, top + 128)],
            stroke: PAL.steelDark,
            lineWidth: 9,
            rotation: () => spin() * 0.4,
          }),
        ],
      }),
      // Outlet nozzle bottom-right -> to the molder
      new Rect({
        x: w / 2 - 4,
        y: -110,
        width: 40,
        height: 26,
        radius: 9,
        fill: PAL.steelDark,
      }),
    ],
  });

  return {
    node,
    level,
    smooth,
    spin,
    surfaceX: x,
    surfaceY: () => floorY + top + h / 2 + (h / 2 - pad - innerH * level()),
  };
}
