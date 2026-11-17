import {Node, Rect, Circle, Line, Gradient} from '@motion-canvas/2d';
import {Vector2, createSignal, easeInOutCubic, all, ThreadGenerator} from '@motion-canvas/core';
import {PAL} from './palette';

/**
 * Stylized cocoa bean: pill-shaped body, center crease, top highlight.
 * `roast` interpolates the palette from raw to roasted (0..1).
 */
export function makeBean(roast = 0, angle = 0, scale = 1): Node {
  const body = roast < 0.5 ? PAL.beanRaw : PAL.beanRoast;
  const lo = roast < 0.5 ? PAL.beanRawLo : PAL.beanRoastHi;
  return new Node({
    rotation: angle,
    scale,
    children: [
      new Rect({
        width: 34,
        height: 24,
        radius: 12,
        fill: new Gradient({
          type: 'linear',
          from: {x: 0, y: -12},
          to: {x: 0, y: 12},
          stops: [
            {offset: 0, color: roast < 0.5 ? PAL.beanRawHi : PAL.beanRoastHi},
            {offset: 0.55, color: body},
            {offset: 1, color: lo},
          ],
        }),
      }),
      new Line({
        points: [
          new Vector2(-13, 0),
          new Vector2(-4, 2.4),
          new Vector2(5, -1.8),
          new Vector2(13, 0.6),
        ],
        stroke: lo,
        lineWidth: 2.6,
      }),
      new Rect({
        width: 14,
        height: 5,
        radius: 2.5,
        y: -6,
        x: -7,
        fill: 'rgba(255,241,220,0.35)',
      }),
    ],
  });
}

/** Small roasted nib particle. */
export function makeNib(size = 10, angle = 0): Rect {
  return new Rect({
    width: size,
    height: size * 0.8,
    radius: size * 0.4,
    rotation: angle,
    fill: PAL.nib,
  });
}

/** Glossy dollop of liquid chocolate. */
export function makeDollop(radius: number): Node {
  return new Node({
    children: [
      new Circle({
        width: radius * 2,
        height: radius * 1.6,
        fill: new Gradient({
          type: 'linear',
          from: {x: 0, y: -radius},
          to: {x: 0, y: radius},
          stops: [
            {offset: 0, color: PAL.pasteHi},
            {offset: 1, color: PAL.liquid},
          ],
        }),
      }),
      new Circle({
        width: radius * 1.1,
        height: radius * 0.5,
        y: -radius * 0.45,
        fill: 'rgba(255,220,180,0.28)',
      }),
    ],
  });
}

/** Finished chocolate bar with molded squares and a gloss sweep. */
export function makeBar(width = 150, height = 88, rows = 2): Node {
  const cols = 4;
  const padX = 12;
  const padY = 10;
  const gap = 5;
  const cellW = (width - padX * 2 - gap * (cols - 1)) / cols;
  const cellH = (height - padY * 2 - gap * (rows - 1)) / rows;
  const squares: Rect[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      squares.push(
        new Rect({
          width: cellW,
          height: cellH,
          x: padX + cellW / 2 + c * (cellW + gap) - width / 2,
          y: padY + cellH / 2 + r * (cellH + gap) - height / 2,
          radius: 5,
          fill: new Gradient({
            type: 'linear',
            from: {x: 0, y: -cellH / 2},
            to: {x: 0, y: cellH / 2},
            stops: [
              {offset: 0, color: PAL.barHi},
              {offset: 1, color: PAL.paste},
            ],
          }),
        }),
      );
    }
  }
  return new Node({
    children: [
      new Rect({
        width,
        height,
        radius: 10,
        fill: new Gradient({
          type: 'linear',
          from: {x: 0, y: -height / 2},
          to: {x: 0, y: height / 2},
          stops: [
            {offset: 0, color: PAL.pasteHi},
            {offset: 0.6, color: PAL.paste},
            {offset: 1, color: PAL.liquid},
          ],
        }),
        stroke: 'rgba(59,32,16,0.9)',
        lineWidth: 2,
      }),
      ...squares,
      new Rect({
        width: width * 0.62,
        height: 8,
        radius: 4,
        x: -width * 0.1,
        y: -height / 2 + 7,
        fill: 'rgba(255,214,166,0.35)',
      }),
    ],
  });
}

/**
 * A bean that travels along the line with a gentle deterministic wobble.
 * The wobble is a piecewise sine built from small tweens - no randomness,
 * no wall-clock reads, safe for deterministic rendering.
 */
export function* travelWobble(
  node: Node,
  fromX: number,
  toX: number,
  time: number,
  baseY: number,
  amplitude = 4,
): ThreadGenerator {
  const steps = Math.max(2, Math.round(time / 0.45));
  const stepTime = time / steps;
  const dirX = Math.sign(toX - fromX);
  const stepX = (toX - fromX) / steps;
  for (let i = 0; i < steps; i++) {
    const up = i % 2 === 0 ? -amplitude : amplitude;
    yield* all(
      node.position.x(node.position.x() + stepX, stepTime, easeInOutCubic),
      node.position.y(baseY + up * 0.5, stepTime, easeInOutCubic),
      node.rotation(node.rotation() + dirX * 7, stepTime, easeInOutCubic),
    );
  }
}
