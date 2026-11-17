import {Node, Rect, Circle, Path, Line, Gradient} from '@motion-canvas/2d';
import {Vector2, createSignal} from '@motion-canvas/core';
import {PAL} from '../palette';
import {steelGradient, groundShadow} from '../shadows';

export interface Grinder {
  node: Node;
  /** Reveal / hide the window cutaway (0..1). */
  cutaway: ReturnType<typeof createSignal<number>>;
  /** Reactive roller spin; tween to rotate the rollers. */
  spin: ReturnType<typeof createSignal<number>>;
  /** Paste pool level (0..1). */
  pasteLevel: ReturnType<typeof createSignal<number>>;
  /** World coords of the crack zone between rollers (camera target). */
  windowX: number;
  windowY: number;
  mouthX: number;
  mouthY: number;
}

/**
 * Grinding station with a circular window cutaway: two counter-rotating
 * steel rollers crack the roasted beans into nibs, which accumulate as a
 * coarse cocoa paste in the trough below.
 */
export function makeGrinder(x: number, floorY: number): Grinder {
  const w = 360;
  const h = 490;
  const top = floorY - h;
  const winR = 112;
  const winY = top + 235;
  const rollerR = 58;
  const mouthX = x - w / 2 + 8;
  const mouthY = floorY - 200;

  const spin = createSignal(0);
  const cutaway = createSignal(0);
  const pasteLevel = createSignal(0);

  const teeth = (cx: number, dir: number): Node =>
    new Node({
      rotation: () => spin() * dir,
      children: Array.from({length: 8}, (_, i) => {
        const a = (i * Math.PI * 2) / 8;
        return new Line({
          points: [
            new Vector2(Math.cos(a) * (rollerR - 16), Math.sin(a) * (rollerR - 16)),
            new Vector2(Math.cos(a) * (rollerR - 2), Math.sin(a) * (rollerR - 2)),
          ],
          stroke: PAL.steelDark,
          lineWidth: 5,
        });
      }),
      x: cx,
    });

  const node = new Node({
    x,
    y: floorY,
    children: [
      groundShadow(w * 1.15, 44, 0.85),
      new Rect({x: -w / 2 + 26, y: -26, width: 18, height: 52, radius: 7, fill: PAL.steelDark}),
      new Rect({x: w / 2 - 26, y: -26, width: 18, height: 52, radius: 7, fill: PAL.steelDark}),
      new Rect({
        y: -h / 2 - 23,
        width: w,
        height: h - 46,
        radius: 26,
        fill: steelGradient(-(h - 46) / 2, (h - 46) / 2),
        stroke: PAL.steelDark,
        lineWidth: 2.5,
      }),
      new Rect({y: -h / 2 + 11, width: w, height: 14, fill: PAL.accent3}),
      // Feed chute on top
      new Path({
        y: -h / 2 - 40,
        data: 'M -50 -46 L 50 -46 L 20 44 L -20 44 Z',
        fill: steelGradient(-46, 46),
        stroke: PAL.steelDark,
        lineWidth: 2.5,
      }),
      // Motor block on the right
      new Rect({
        x: w / 2 + 34,
        y: -h / 2 + 190,
        width: 74,
        height: 120,
        radius: 16,
        fill: PAL.steelLo,
        stroke: PAL.steelDark,
        lineWidth: 2.5,
      }),
      new Circle({
        x: w / 2 + 34,
        y: -h / 2 + 190,
        width: 40,
        height: 40,
        fill: PAL.steel,
        stroke: PAL.steelDark,
        lineWidth: 3,
        rotation: () => spin() * 0.5,
        children: [
          new Line({
            points: [new Vector2(-16, 0), new Vector2(16, 0)],
            stroke: PAL.steelDark,
            lineWidth: 4,
          }),
        ],
      }),
      // Window cutaway
      new Node({
        y: winY - floorY,
        opacity: () => 0.4 + cutaway() * 0.6,
        children: [
          new Circle({
            width: winR * 2,
            height: winR * 2,
            fill: new Gradient({
              type: 'radial',
              from: {x: 0, y: -30},
              to: {x: 0, y: 0},
              fromRadius: 10,
              toRadius: winR,
              stops: [
                {offset: 0, color: '#33200F'},
                {offset: 1, color: '#241408'},
              ],
            }),
            children: [
              // rollers
              new Circle({
                x: -rollerR - 6,
                y: -22,
                width: rollerR * 2,
                height: rollerR * 2,
                fill: steelGradient(-rollerR, rollerR),
                stroke: PAL.steelDark,
                lineWidth: 3,
                children: [teeth(0, 1)],
              }),
              new Circle({
                x: rollerR + 6,
                y: -22,
                width: rollerR * 2,
                height: rollerR * 2,
                fill: steelGradient(-rollerR, rollerR),
                stroke: PAL.steelDark,
                lineWidth: 3,
                children: [teeth(0, -1)],
              }),
              // paste trough filling up (bottom edge stays fixed)
              new Rect({
                width: 168,
                height: 40,
                radius: 8,
                y: () => 58 + 20 * (1 - pasteLevel()),
                fill: PAL.paste,
                scaleY: () => Math.max(0.001, pasteLevel()),
              }),
              // faint falling nibs line
              new Line({
                points: [new Vector2(0, -34), new Vector2(0, 44)],
                stroke: 'rgba(110,67,36,0.85)',
                lineWidth: 7,
              }),
            ],
          }),
          new Circle({width: winR * 2 + 16, height: winR * 2 + 16, stroke: PAL.steel, lineWidth: 7, fill: null}),
          new Circle({
            width: winR * 2 + 34,
            height: winR * 2 + 34,
            stroke: 'rgba(64,41,27,0.55)',
            lineWidth: 3,
            lineDash: [14, 12],
            fill: null,
          }),
        ],
      }),
      // Intake mouth at belt height (left wall)
      new Rect({
        x: -w / 2 - 2,
        y: mouthY - floorY,
        width: 22,
        height: 46,
        radius: 8,
        fill: '#2E1A0E',
      }),
      // Paste outlet at the bottom right -> to the conche pipe
      new Rect({
        x: w / 2 - 6,
        y: -76,
        width: 34,
        height: 26,
        radius: 9,
        fill: PAL.steelDark,
      }),
    ],
  });

  return {
    node,
    cutaway,
    spin,
    pasteLevel,
    windowX: x,
    windowY: winY,
    mouthX,
    mouthY,
  };
}
