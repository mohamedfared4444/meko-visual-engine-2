import {Node, Rect, Circle, Path, Line, Gradient} from '@motion-canvas/2d';
import {Vector2, createSignal, Color} from '@motion-canvas/core';
import {PAL} from '../palette';
import {steelGradient, warmGlow, groundShadow} from '../shadows';

export interface Roaster {
  node: Node;
  /** World x where the intake mouth swallows beans. */
  mouthX: number;
  mouthY: number;
  /** Reveal / hide the porthole cutaway (0..1). */
  cutaway: ReturnType<typeof createSignal<number>>;
  /** Heat glow intensity (0..1). */
  heat: ReturnType<typeof createSignal<number>>;
  /** Reactive spin signal; tween its value to rotate the drum. */
  spin: ReturnType<typeof createSignal<number>>;
  /** Roast progress (0 = raw, 1 = roasted); darkens the beans inside. */
  roast: ReturnType<typeof createSignal<number>>;
  /** World coords of the porthole center (for camera close-ups). */
  windowX: number;
  windowY: number;
}

/**
 * Roasting machine with a porthole cutaway into the drum.
 *
 * The cutaway shows tumbling beans over a warm heat glow; the drum spin,
 * heat intensity and cutaway reveal are all reactive signals.
 */
export function makeRoaster(x: number, floorY: number): Roaster {
  const w = 360;
  const h = 490;
  const top = floorY - h;
  const bodyX = x;
  const drumY = top + 240;
  const drumR = 165;
  const winR = 108;
  const mouthX = x - w / 2 + 8;
  const mouthY = floorY - 200;

  const spin = createSignal(0);
  const heat = createSignal(0);
  const cutaway = createSignal(0);
  const roast = createSignal(0);

  // Tumbling beans inside the drum (fixed, deterministic positions).
  const innerBeans: Node[] = [];
  const beanAngles = [0, 72, 144, 216, 288];
  const beanRadii = [58, 84, 58, 84, 58];
  for (let i = 0; i < beanAngles.length; i++) {
    innerBeans.push(
      new Circle({
        width: 26,
        height: 20,
        fill: () => Color.lerp(new Color(PAL.beanRaw), new Color(PAL.beanRoast), roast()),
        rotation: () => spin() * 0.6,
        position: () => {
          const a = ((beanAngles[i] + spin() * 0.8) * Math.PI) / 180;
          return new Vector2(Math.cos(a) * beanRadii[i], Math.sin(a) * beanRadii[i] * 0.82);
        },
      }),
    );
  }

  const body = new Node({
    x,
    y: floorY,
    children: [
      groundShadow(w * 1.15, 44, 0.85),
      // Legs
      new Rect({x: -w / 2 + 26, y: -26, width: 18, height: 52, radius: 7, fill: PAL.steelDark}),
      new Rect({x: w / 2 - 26, y: -26, width: 18, height: 52, radius: 7, fill: PAL.steelDark}),
      // Main body (bottom edge sits on the legs at y = -23)
      new Rect({
        y: -h / 2 - 23,
        width: w,
        height: h - 46,
        radius: 26,
        fill: steelGradient(-(h - 46) / 2, (h - 46) / 2),
        stroke: PAL.steelDark,
        lineWidth: 2.5,
      }),
      // Accent band (stage 2)
      new Rect({
        y: -h / 2 + 11,
        width: w,
        height: 14,
        fill: PAL.accent2,
      }),
      // Hopper on top
      new Path({
        y: -h / 2 - 42,
        data: 'M -44 -46 L 44 -46 L 22 46 L -22 46 Z',
        fill: steelGradient(-46, 46),
        stroke: PAL.steelDark,
        lineWidth: 2.5,
      }),
      new Rect({y: -h / 2 - 88, width: 100, height: 18, radius: 9, fill: PAL.steelLo, stroke: PAL.steelDark, lineWidth: 2}),
      // Chimney + smoke puffs (static shapes, opacity animated via heat)
      new Rect({x: w / 2 - 52, y: -h / 2 - 26, width: 20, height: 40, radius: 6, fill: PAL.steelLo, stroke: PAL.steelDark, lineWidth: 2}),
      // Flame glow under the drum
      new Node({
        y: -60,
        opacity: () => heat(),
        children: [warmGlow(150)],
      }),
      // Heat shimmer ticks
      new Line({
        x: -w / 2 + 52,
        y: -h / 2 + 150,
        points: [new Vector2(0, 26), new Vector2(10, 8), new Vector2(0, -12), new Vector2(8, -30)],
        stroke: PAL.accent2,
        lineWidth: 4,
        opacity: () => 0.25 + heat() * 0.55,
      }),
      new Line({
        x: w / 2 - 52,
        y: -h / 2 + 190,
        points: [new Vector2(0, 30), new Vector2(-10, 10), new Vector2(0, -12), new Vector2(-8, -32)],
        stroke: PAL.accent2,
        lineWidth: 4,
        opacity: () => 0.2 + heat() * 0.5,
      }),
      // Porthole cutaway
      new Node({
        y: drumY - floorY,
        opacity: () => 0.35 + cutaway() * 0.65,
        children: [
          new Circle({
            width: winR * 2,
            height: winR * 2,
            fill: new Gradient({
              type: 'radial',
              from: {x: 0, y: -20},
              to: {x: 0, y: 0},
              fromRadius: 10,
              toRadius: winR,
              stops: [
                {offset: 0, color: '#2E1A0E'},
                {offset: 0.62, color: '#4A2A14'},
                {offset: 1, color: '#2A160B'},
              ],
            }),
            children: innerBeans,
          }),
          // warm inner glow visible through the window
          new Node({opacity: () => heat() * 0.8, children: [warmGlow(winR * 0.9)]}),
          // rotating drum vanes seen through the window
          new Line({
            points: [
              new Vector2(-winR + 14, 0),
              new Vector2(-winR / 2, 26),
              new Vector2(0, 0),
              new Vector2(winR / 2, -26),
              new Vector2(winR - 14, 0),
            ],
            stroke: 'rgba(255,214,160,0.30)',
            lineWidth: 5,
            rotation: () => spin() * 0.8,
          }),
          // dashed cut outline + metal ring
          new Circle({
            width: winR * 2 + 16,
            height: winR * 2 + 16,
            stroke: PAL.steel,
            lineWidth: 7,
            fill: null,
          }),
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
      // Intake mouth (dark opening at belt height on the left wall)
      new Rect({
        x: -w / 2 - 2,
        y: mouthY - floorY,
        width: 22,
        height: 46,
        radius: 8,
        fill: '#2E1A0E',
      }),
      // Outlet chute (roasted beans slide out on the right wall)
      new Rect({
        x: w / 2 - 2,
        y: mouthY - floorY + 25,
        width: 22,
        height: 46,
        radius: 8,
        fill: '#2E1A0E',
      }),
    ],
  });

  return {
    node: body,
    mouthX,
    mouthY,
    cutaway,
    heat,
    spin,
    roast,
    windowX: x,
    windowY: drumY,
  };
}
