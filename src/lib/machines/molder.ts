import {Node, Rect, Circle, Path, Line, Gradient} from '@motion-canvas/2d';
import {Vector2, createSignal, SimpleSignal} from '@motion-canvas/core';
import {PAL} from '../palette';
import {steelGradient, groundShadow} from '../shadows';

/**
 * Depositing tower: elevated hopper with a single central nozzle that
 * dispenses a measured dollop of liquid chocolate into a passing mold.
 */
export function makeDepositor(x: number, topY: number): Node {
  const nozzles = [
    new Path({
      y: 118,
      data: 'M -24 -34 L 24 -34 L 10 34 L -10 34 Z',
      fill: steelGradient(-34, 34),
      stroke: PAL.steelDark,
      lineWidth: 2,
    }),
  ];
  return new Node({
    x,
    y: topY,
    children: [
      // support legs down to the floor are drawn by the caller via the gantry
      new Rect({
        y: 30,
        width: 210,
        height: 96,
        radius: 20,
        fill: steelGradient(-48, 48),
        stroke: PAL.steelDark,
        lineWidth: 2.5,
      }),
      new Rect({y: -14, width: 210, height: 14, radius: 7, fill: PAL.accent5}),
      ...nozzles,
    ],
  });
}

/** Support gantry for the depositor (legs to the floor). */
export function makeDepositorGantry(x: number, floorY: number, topY: number): Node {
  const legH = floorY - (topY + 160);
  return new Node({
    x,
    y: floorY,
    children: [
      new Rect({x: -110, y: -(legH / 2) - 10, width: 18, height: legH, radius: 8, fill: PAL.steelLo}),
      new Rect({x: 110, y: -(legH / 2) - 10, width: 18, height: legH, radius: 8, fill: PAL.steelLo}),
    ],
  });
}

/** Chilled chocolate path: pipe from the conche with a small pump box. */
export function makeChocolatePipe(): Node {
  const elbow = (x: number, y: number): Circle =>
    new Circle({x, y, width: 30, height: 30, fill: PAL.steelLo, stroke: PAL.steelDark, lineWidth: 2});
  const seg = (x: number, y: number, w: number, h: number): Rect =>
    new Rect({x, y, width: w, height: h, radius: 12, fill: PAL.steelLo, stroke: PAL.steelDark, lineWidth: 2});
  return new Node({
    children: [
      seg(2180, -110, 130, 26), // horizontal run out of the conche
      elbow(2255, -110),
      new Node({
        x: 2288,
        y: -330,
        children: [
          new Rect({width: 26, height: 430, radius: 12, fill: PAL.steelLo, stroke: PAL.steelDark, lineWidth: 2}),
          new Circle({
            x: 26,
            width: 56,
            height: 56,
            fill: PAL.steel,
            stroke: PAL.steelDark,
            lineWidth: 3,
          }),
        ],
      }),
    ],
  });
}

/** Cooling tunnel with frosted panels and chill ticks. */
export function makeCoolingTunnel(x: number, floorY: number): Node {
  const w = 300;
  const h = 300;
  return new Node({
    x,
    y: floorY,
    children: [
      groundShadow(w * 1.05, 40, 0.8),
      new Rect({
        y: -h / 2 - 40,
        width: w,
        height: h,
        radius: 26,
        fill: new Gradient({
          type: 'linear',
          from: {x: 0, y: -150},
          to: {x: 0, y: 150},
          stops: [
            {offset: 0, color: '#DCEBF3'},
            {offset: 1, color: '#A9C6D6'},
          ],
        }),
        stroke: PAL.steelDark,
        lineWidth: 2.5,
      }),
      // dark entry + exit openings
      new Rect({x: -w / 2 - 12, y: -78, width: 26, height: 76, radius: 10, fill: '#2A3A46'}),
      new Rect({x: w / 2 - 14, y: -78, width: 26, height: 76, radius: 10, fill: '#2A3A46'}),
      // frost ticks
      new Line({
        x: -52,
        y: -230,
        points: [new Vector2(0, -16), new Vector2(0, 16), new Vector2(-11, -8), new Vector2(11, -8), new Vector2(-11, 8), new Vector2(11, 8)],
        stroke: 'rgba(255,255,255,0.85)',
        lineWidth: 3.5,
      }),
      new Line({
        x: 46,
        y: -170,
        points: [new Vector2(0, -12), new Vector2(0, 12), new Vector2(-9, -6), new Vector2(9, -6), new Vector2(-9, 6), new Vector2(9, 6)],
        stroke: 'rgba(255,255,255,0.7)',
        lineWidth: 3,
      }),
      new Rect({y: -h / 2 - 40 + 12, width: w, height: 14, radius: 7, fill: PAL.accent5}),
    ],
  });
}

export interface Mold {
  node: Node;
  /** Chocolate fill level inside the cavity (0..1). */
  fill: SimpleSignal<number>;
  /** Cavity center in mold-local coords. */
  cavityY: number;
}

/** A single-cavity chocolate mold that rides the molding belt. */
export function makeMold(): Mold {
  const fill = createSignal(0);
  const cavityW = 168;
  const cavityH = 44;
  const node = new Node({
    children: [
      new Rect({
        width: 210,
        height: 64,
        radius: 12,
        fill: steelGradient(-32, 32),
        stroke: PAL.steelDark,
        lineWidth: 2.5,
      }),
      // cavity
      new Rect({
        width: cavityW + 10,
        height: cavityH + 10,
        radius: 12,
        fill: '#2A1B10',
      }),
      new Rect({
        width: cavityW,
        height: cavityH,
        radius: 9,
        y: () => 22 - 22 * fill(),
        scaleY: () => Math.max(0.001, fill()),
        fill: () => (fill() > 0.99 ? PAL.liquid : PAL.paste),
      }),
      // handles
      new Rect({x: -124, width: 26, height: 14, radius: 7, fill: PAL.steelDark}),
      new Rect({x: 124, width: 26, height: 14, radius: 7, fill: PAL.steelDark}),
    ],
  });
  return {node, fill, cavityY: 0};
}
