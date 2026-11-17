import {Circle, Gradient} from '@motion-canvas/2d';
import {PAL} from './palette';

/**
 * Soft-contact shadow: a radial gradient ellipse fading to transparent.
 * Cheaper and smoother than CSS shadows, consistent with the 2.5D look.
 */
export function groundShadow(width: number, height: number, alpha = 0.5): Circle {
  return new Circle({
    width,
    height,
    fill: new Gradient({
      type: 'radial',
      from: {x: 0, y: 0},
      to: {x: 0, y: 0},
      fromRadius: 0,
      toRadius: width / 2,
      stops: [
        {offset: 0, color: PAL.shadowDeep},
        {offset: 0.62, color: PAL.shadow},
        {offset: 1, color: 'rgba(64,41,27,0)'},
      ],
    }),
    opacity: alpha,
  });
}

/** Warm glow used under the roaster drum and inside cutaways. */
export function warmGlow(radius: number): Circle {
  return new Circle({
    width: radius * 2,
    height: radius * 2,
    fill: new Gradient({
      type: 'radial',
      from: {x: 0, y: 0},
      to: {x: 0, y: 0},
      fromRadius: 0,
      toRadius: radius,
      stops: [
        {offset: 0, color: 'rgba(255,196,110,0.85)'},
        {offset: 0.55, color: PAL.glow},
        {offset: 1, color: 'rgba(255,176,88,0)'},
      ],
    }),
  });
}

/** Vertical steel body gradient (light on top, darker at the bottom). */
export function steelGradient(fromY: number, toY: number): Gradient {
  return new Gradient({
    type: 'linear',
    from: {x: 0, y: fromY},
    to: {x: 0, y: toY},
    stops: [
      {offset: 0, color: PAL.steel},
      {offset: 0.55, color: PAL.steelLo},
      {offset: 1, color: PAL.steelDark},
    ],
  });
}

/** Vertical background wash (whole world backdrop). */
export function skyGradient(fromY: number, toY: number): Gradient {
  return new Gradient({
    type: 'linear',
    from: {x: 0, y: fromY},
    to: {x: 0, y: toY},
    stops: [
      {offset: 0, color: PAL.bgTop},
      {offset: 1, color: PAL.bgBottom},
    ],
  });
}

/** Vertical floor gradient. */
export function floorGradient(fromY: number, toY: number): Gradient {
  return new Gradient({
    type: 'linear',
    from: {x: 0, y: fromY},
    to: {x: 0, y: toY},
    stops: [
      {offset: 0, color: PAL.floorTop},
      {offset: 1, color: PAL.floorBottom},
    ],
  });
}
