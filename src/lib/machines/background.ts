import {Node, Rect, Line, Circle, Gradient} from '@motion-canvas/2d';
import {Vector2} from '@motion-canvas/core';
import {PAL} from '../palette';
import {WORLD} from '../world';
import {skyGradient, floorGradient, groundShadow} from '../shadows';

/**
 * Background parallax layer: warm sky wash + soft distant factory
 * silhouettes. Factor < 1 makes the background drift slower than the
 * production line, establishing layered depth.
 */
export function makeBackground(): Node {
  const spans: Array<[number, number, number, number, string]> = [
    [-400, 180, 260, 240, PAL.silhouette],
    [320, 150, 180, 200, PAL.silhouetteDeep],
    [900, 210, 300, 260, PAL.silhouette],
    [1550, 140, 220, 210, PAL.silhouetteDeep],
    [2200, 190, 280, 250, PAL.silhouette],
    [2850, 130, 200, 200, PAL.silhouetteDeep],
    [3350, 170, 260, 240, PAL.silhouette],
  ];
  const shapes: Node[] = [];
  for (const [x, w, h, raise, color] of spans) {
    shapes.push(
      new Rect({
        x,
        y: WORLD.floorY - h - raise * 0.35,
        width: w,
        height: h,
        radius: 26,
        fill: color,
        opacity: 0.5,
      }),
    );
  }
  // Soft hanging light discs (stylized factory lamps)
  const lamps: Node[] = [];
  for (const lx of [420, 1180, 1980, 2760]) {
    lamps.push(
      new Node({
        x: lx,
        y: 330,
        children: [
          new Line({
            points: [new Vector2(0, -70), new Vector2(0, 0)],
            stroke: PAL.silhouetteDeep,
            lineWidth: 6,
            opacity: 0.6,
          }),
          new Circle({
            width: 64,
            height: 26,
            y: 14,
            fill: '#F6D9A0',
            opacity: 0.85,
          }),
          new Circle({
            width: 130,
            height: 54,
            y: 26,
            fill: new Gradient({
              type: 'radial',
              from: {x: 0, y: 0},
              to: {x: 0, y: 0},
              fromRadius: 0,
              toRadius: 65,
              stops: [
                {offset: 0, color: 'rgba(246,217,160,0.5)'},
                {offset: 1, color: 'rgba(246,217,160,0)'},
              ],
            }),
          }),
        ],
      }),
    );
  }
  return new Node({
    children: [
      new Rect({
        x: 1600,
        y: -6200,
        width: 6400,
        height: WORLD.floorY + 6400,
        fill: skyGradient(-3790, 3790),
      }),
      ...shapes,
      ...lamps,
    ],
  });
}

/** Main layer floor: solid ground band with a soft top edge. */
export function makeFloor(): Node {
  return new Node({
    children: [
      new Rect({
        x: 1600,
        y: WORLD.floorY,
        width: 6400,
        height: 6200,
        fill: floorGradient(-3100, -2200),
      }),
      new Line({
        points: [new Vector2(-1600, WORLD.floorY), new Vector2(4800, WORLD.floorY)],
        stroke: PAL.floorLine,
        lineWidth: 5,
        opacity: 0.65,
      }),
      // long soft shadow band under the whole line
      new Rect({
        x: 1600,
        y: WORLD.floorY + 4,
        width: 3600,
        height: 26,
        radius: 13,
        fill: PAL.shadow,
        opacity: 0.5,
      }),
    ],
  });
}

/** Foreground parallax layer: dark near-field edge for depth. */
export function makeForeground(): Node {
  return new Node({
    children: [
      new Rect({
        x: 1600,
        y: 1300,
        width: 6400,
        height: 900,
        fill: new Gradient({
          type: 'linear',
          from: {x: 0, y: -450},
          to: {x: 0, y: -250},
          stops: [
            {offset: 0, color: 'rgba(93,60,36,0)'},
            {offset: 0.35, color: 'rgba(93,60,36,0.22)'},
            {offset: 1, color: 'rgba(93,60,36,0.45)'},
          ],
        }),
      }),
    ],
  });
}

/** Ground shadow pair helper for machines. */
export function machineShadow(width: number): Node {
  return groundShadow(width, 46, 0.85);
}
