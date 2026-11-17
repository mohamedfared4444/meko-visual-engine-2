import {Node, Rect, Circle, Line} from '@motion-canvas/2d';
import {Vector2, createSignal, SimpleSignal} from '@motion-canvas/core';
import {PAL} from '../palette';

export interface Conveyor {
  node: Node;
  /** Distance driven into the belt (world px). Tween this to move it. */
  drive: SimpleSignal<number>;
  /** Gap between tread stripes (world px). */
  gap: number;
}

/**
 * Stylized belt conveyor with a seamless tread loop and rotating rollers.
 *
 * The tread offset and roller angles are REACTIVE derived signals off a
 * single `drive` distance signal, so the belt animates itself as soon as
 * the drive is tweened - no per-frame imperative code.
 */
export function makeConveyor(
  length: number,
  beltY: number,
  x = 0,
): Conveyor {
  const rollerR = 17;
  const beltH = 26;
  const gap = 64;
  const drive = createSignal(0);
  const nStripes = Math.ceil(length / gap) + 2;

  const stripes: Rect[] = [];
  for (let i = 0; i < nStripes; i++) {
    stripes.push(
      new Rect({
        x: i * gap + (gap - 26) / 2,
        y: 0,
        width: 26,
        height: beltH - 8,
        radius: 6,
        fill: PAL.beltStripe,
      }),
    );
  }

  const legs: Rect[] = [];
  const legCount = Math.max(2, Math.round(length / 320));
  for (let i = 0; i <= legCount; i++) {
    const lx = -length / 2 + 30 + (i * (length - 60)) / legCount;
    legs.push(
      new Rect({
        x: lx,
        y: beltH / 2 + 52,
        width: 16,
        height: 104,
        radius: 7,
        fill: PAL.steelLo,
      }),
    );
  }

  const node = new Node({
    x,
    y: beltY + beltH / 2,
    children: [
      new Rect({
        x: 0,
        y: beltH / 2 + 56,
        width: length * 0.92,
        height: 30,
        radius: 15,
        fill: PAL.shadow,
        opacity: 0.8,
      }),
      ...legs,
      new Rect({
        width: length,
        height: beltH,
        radius: 13,
        fill: PAL.belt,
        clip: true,
        children: [
          new Node({
            children: stripes,
            position: () => new Vector2(-length / 2 - gap + (drive() % gap), 0),
          }),
        ],
      }),
      new Line({
        points: [new Vector2(-length / 2, -beltH / 2), new Vector2(length / 2, -beltH / 2)],
        stroke: 'rgba(255,235,200,0.35)',
        lineWidth: 3,
      }),
      new Circle({
        x: -length / 2,
        width: rollerR * 2,
        height: rollerR * 2,
        fill: PAL.roller,
        stroke: PAL.belt,
        lineWidth: 3,
        rotation: () => (drive() / rollerR) * 57.2958,
        children: [
          new Line({
            points: [new Vector2(-rollerR + 4, 0), new Vector2(rollerR - 4, 0)],
            stroke: PAL.belt,
            lineWidth: 2.5,
          }),
        ],
      }),
      new Circle({
        x: length / 2,
        width: rollerR * 2,
        height: rollerR * 2,
        fill: PAL.roller,
        stroke: PAL.belt,
        lineWidth: 3,
        rotation: () => (drive() / rollerR) * 57.2958,
        children: [
          new Line({
            points: [new Vector2(-rollerR + 4, 0), new Vector2(rollerR - 4, 0)],
            stroke: PAL.belt,
            lineWidth: 2.5,
          }),
        ],
      }),
    ],
  });

  return {node, drive, gap};
}
